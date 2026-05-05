import {
  ITaskQuery,
  MarkupConverter,
  PagedResultDTO,
  PaginationOptionsDTO,
  Participants,
  TaskDTO,
} from '@metric-org/sdk'

import { RedmineBase } from '@/RedmineBase'

export class RedmineTaskQuery extends RedmineBase implements ITaskQuery {
  public async pull(
    memberId: string,
    checkpoint: { updatedAt: Date; id: string },
    batch: number,
  ): Promise<TaskDTO[]> {
    console.log(
      `[REDMINE_PULL] Iniciando pull para Member: ${memberId}, Batch: ${batch}`,
    )
    console.log(
      `[REDMINE_PULL] Checkpoint atual: ID=${checkpoint.id}, UpdatedAt=${checkpoint.updatedAt.toISOString()}`,
    )

    const client = await this.getAuthenticatedClient()
    const checkpointDate = checkpoint.updatedAt.toISOString().split('.')[0]
    const limitPerRequest = 100

    const fetchAllPages = async (queryParams: object): Promise<any[]> => {
      const queryTag = JSON.stringify(queryParams)
      console.log(
        `[REDMINE_PULL][PAGINATION] Iniciando fetchAllPages para: ${queryTag}`,
      )

      const allIssuesForFilter: any[] = []
      let offset = 0
      let keepFetching = true

      while (keepFetching) {
        try {
          console.log(
            `[REDMINE_PULL][PAGINATION] Request: issues.json | Offset: ${offset} | Limit: ${limitPerRequest}`,
          )
          const response = await client.get('issues.json', {
            params: {
              ...queryParams,
              status_id: '*',
              limit: limitPerRequest,
              offset,
            },
          })

          const receivedIssues = response.data.issues
          const count = receivedIssues?.length || 0
          console.log(
            `[REDMINE_PULL][PAGINATION] Recebidos ${count} itens do Redmine.`,
          )

          if (receivedIssues?.length) {
            allIssuesForFilter.push(...receivedIssues)
          }

          if (!receivedIssues || receivedIssues.length < limitPerRequest) {
            console.log(
              `[REDMINE_PULL][PAGINATION] Fim das páginas para esta query.`,
            )
            keepFetching = false
          } else {
            offset += limitPerRequest
            console.log(
              `[REDMINE_PULL][PAGINATION] Avançando para próximo offset: ${offset}`,
            )
          }
        } catch (error: any) {
          console.error(
            '[REDMINE_PULL][PAGINATION][ERROR] Falha na requisição:',
            error.message,
          )
          keepFetching = false
        }
      }
      return allIssuesForFilter
    }

    const customFieldIds = [8, 9, 16, 24]
    const baseSearchParams = {
      updated_on: `>=${checkpointDate}`,
      sort: 'updated_on:asc,id:asc',
    }
    const trackerIdsToPull = [3, 5, 11, 12, 13, 19]

    console.log(
      `[REDMINE_PULL] Disparando Promise.all para queries paralelas...`,
    )
    const fetchPromises = [
      fetchAllPages({ ...baseSearchParams, assigned_to_id: memberId }),
      fetchAllPages({ ...baseSearchParams, author_id: memberId }),
      ...customFieldIds.map((fieldId) =>
        fetchAllPages({ ...baseSearchParams, [`cf_${fieldId}`]: memberId }),
      ),
      fetchAllPages({
        ...baseSearchParams,
        tracker_id: trackerIdsToPull.join('|'),
      }),
    ]

    const resultsFromAllPages = await Promise.all(fetchPromises)
    console.log(
      `[REDMINE_PULL] Promise.all finalizado. Unificando resultados...`,
    )

    const allIssues = resultsFromAllPages.flatMap((list) => list)
    console.log(
      `[REDMINE_PULL] Total de issues brutas (com duplicatas): ${allIssues.length}`,
    )

    const uniqueIssuesMap = new Map(allIssues.map((issue) => [issue.id, issue]))
    console.log(
      `[REDMINE_PULL] Total de issues únicas: ${uniqueIssuesMap.size}`,
    )

    const sortedUniqueIssues = Array.from(uniqueIssuesMap.values()).sort(
      (a, b) => {
        const dateA = new Date(a.updated_on).getTime()
        const dateB = new Date(b.updated_on).getTime()
        if (dateA !== dateB) return dateA - dateB
        return a.id - b.id
      },
    )

    const newTasksFound: TaskDTO[] = []

    const customFieldRoleMap = new Map<number, string>([
      [8, '1'],
      [9, '2'],
      [16, '3'],
      [24, '4'],
    ])

    console.log(
      `[REDMINE_PULL] Iniciando processamento detalhado e filtro de checkpoint...`,
    )

    for (const issue of sortedUniqueIssues) {
      const fullIssue = issue

      if (
        fullIssue.updated_on === checkpointDate &&
        Number(fullIssue.id) <= Number(checkpoint.id)
      ) {
        // Log omitido para evitar flood, habilitar se necessário:
        // console.log(`[REDMINE_PULL][SKIP] Issue ${fullIssue.id} já processada no checkpoint.`);
        continue
      }

      console.log(
        `[REDMINE_PULL][PROCESSING] Mapeando Issue ID: ${fullIssue.id}`,
      )

      const statusChanges = (fullIssue.journals || [])
        .map((journal: any) => {
          const statusDetail = (journal.details || []).find(
            (d: any) => d.name === 'status_id',
          )
          if (statusDetail && journal.user) {
            return {
              fromStatus: statusDetail.old_value,
              toStatus: statusDetail.new_value,
              description: journal.notes
                ? MarkupConverter.fromTextile(
                    journal.notes,
                    this.context?.config?.apiUrl! as string,
                  )
                : undefined,
              changedBy: {
                id: journal.user.id.toString(),
                name: journal.user.name,
              },
              changedAt: new Date(journal.created_on),
            }
          }
          return null
        })
        .filter(Boolean)

      const knownNames = new Map<string, string>()
      if (fullIssue.author) {
        knownNames.set(fullIssue.author.id.toString(), fullIssue.author.name)
      }
      if (fullIssue.assigned_to) {
        knownNames.set(
          fullIssue.assigned_to.id.toString(),
          fullIssue.assigned_to.name,
        )
      }

      const participantRoles = new Map<string, Set<string>>()

      const addRole = (userId: string, roleId: string) => {
        if (!userId || !roleId) return
        if (!participantRoles.has(userId)) {
          participantRoles.set(userId, new Set<string>())
        }
        participantRoles.get(userId)!.add(roleId)
      }

      if (fullIssue.author) {
        addRole(fullIssue.author.id.toString(), '5')
      }
      if (fullIssue.assigned_to) {
        addRole(fullIssue.assigned_to.id.toString(), 'assignee')
      }

      const customFields: any[] = fullIssue.custom_fields || []
      for (const field of customFields) {
        if (customFieldRoleMap.has(field.id) && field.value) {
          const roleId = customFieldRoleMap.get(field.id)!
          const userIds: string[] = (
            Array.isArray(field.value) ? field.value : [field.value]
          ).filter(Boolean)

          for (const userId of userIds) {
            if (!knownNames.has(userId)) {
              knownNames.set(userId, `Usuário (${userId})`)
            }
            addRole(userId, roleId)
          }
        }
      }

      const participants: Participants[] = []
      for (const [userId, roles] of participantRoles.entries()) {
        const name = knownNames.get(userId)!
        for (const roleId of roles) {
          participants.push({
            id: userId,
            name: name,
            role: { id: roleId },
          })
        }
      }

      const estimatedTimes = [
        {
          id: '1',
          name: 'Produção',
          activities: [
            { id: '8', name: 'Design' },
            { id: '9', name: 'Desenvolvimento' },
            { id: '10', name: 'Analise' },
            { id: '11', name: 'Planejamento' },
            { id: '14', name: 'Revisão Código' },
            { id: '16', name: 'Correção' },
          ],
          hours:
            Number(
              (fullIssue.custom_fields as any[]).find((c) => c.id === 57)
                ?.value,
            ) || 0,
        },
        {
          id: '2',
          name: 'Validação',
          activities: [
            { id: '13', name: 'Teste' },
            { id: '19', name: 'Homologação' },
          ],
          hours:
            Number(
              (fullIssue.custom_fields as any[]).find((c) => c.id === 58)
                ?.value,
            ) || 0,
        },
        {
          id: '3',
          name: 'Documentação',
          activities: [{ id: '25', name: 'Documentação' }],
          hours:
            Number(
              (fullIssue.custom_fields as any[]).find((c) => c.id === 59)
                ?.value,
            ) || 0,
        },
        {
          id: '4',
          name: 'Genérico / Outras',
          activities: [],
          hours: Number(fullIssue.estimated_hours) || 0,
        },
      ].filter((item) => item.hours > 0)

      const task: TaskDTO = {
        id: fullIssue.id.toString(),
        url: `${this.context?.config?.apiUrl}/issues/${fullIssue.id}`,
        title: fullIssue.subject,
        description: fullIssue.description
          ? MarkupConverter.fromTextile(
              fullIssue.description,
              this.context?.config?.apiUrl! as string,
            )
          : undefined,
        projectName: fullIssue.project?.name,
        status: {
          id: fullIssue.status.id.toString(),
          name: fullIssue.status.name,
        },
        tracker: fullIssue.tracker
          ? { id: fullIssue.tracker.id.toString() }
          : undefined,
        priority: fullIssue.priority
          ? {
              id: fullIssue.priority.id.toString(),
              name: fullIssue.priority.name,
            }
          : undefined,
        assignedTo: fullIssue.assigned_to
          ? {
              id: fullIssue.assigned_to.id.toString(),
              name: fullIssue.assigned_to.name,
            }
          : undefined,
        author: fullIssue.author
          ? { id: fullIssue.author.id.toString(), name: fullIssue.author.name }
          : undefined,
        createdAt: new Date(fullIssue.created_on),
        updatedAt: new Date(fullIssue.updated_on),
        startDate: fullIssue.start_date
          ? new Date(fullIssue.start_date)
          : undefined,
        dueDate: fullIssue.due_date ? new Date(fullIssue.due_date) : undefined,
        doneRatio: fullIssue.done_ratio,
        spentHours: fullIssue.spent_hours,
        estimatedTimes: estimatedTimes,
        statusChanges: statusChanges.length > 0 ? statusChanges : undefined,
        participants: participants.length > 0 ? participants : undefined,
      }

      newTasksFound.push(task)
      console.log(
        `[REDMINE_PULL][SUCCESS] Task ${fullIssue.id} adicionada ao lote atual.`,
      )

      if (newTasksFound.length >= batch) {
        console.log(
          `[REDMINE_PULL] Batch atingido (${batch}). Interrompendo processamento.`,
        )
        break
      }
    }

    console.log(
      `[REDMINE_PULL] Finalizado. Retornando ${newTasksFound.length} documentos.`,
    )
    return newTasksFound.slice(0, batch)
  }

  findAll(pagination?: PaginationOptionsDTO): Promise<PagedResultDTO<TaskDTO>> {
    throw new Error('Method findAll RedmineTaskQuery not implemented.')
  }

  findById(id: string): Promise<TaskDTO | undefined> {
    throw new Error('Method findById RedmineTaskQuery not implemented.')
  }

  findByIds(ids: string[]): Promise<TaskDTO[]> {
    throw new Error('Method findByIds RedmineTaskQuery not implemented.')
  }

  findByCondition(
    condition: Partial<TaskDTO>,
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<TaskDTO>> {
    throw new Error('Method findByCondition RedmineTaskQuery not implemented.')
  }

  count(criteria?: Partial<TaskDTO>): Promise<number> {
    throw new Error('Method count RedmineTaskQuery not implemented.')
  }

  exists(criteria: Partial<TaskDTO>): Promise<boolean> {
    throw new Error('Method exists RedmineTaskQuery not implemented.')
  }
}
