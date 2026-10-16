export type NotificationPrefs = {
  dueAccounts: boolean
  pendingIncome: boolean
  budgetAlerts: boolean
  weeklySummary: boolean
}

const STORAGE_KEY = 'mf-notification-last-check'

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function showLocalNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag, lang: 'pt-BR' })
  } catch {
    // Service worker path
    void navigator.serviceWorker?.ready.then((reg) => {
      void reg.showNotification(title, { body, tag, lang: 'pt-BR' })
    })
  }
}

/** Verificações locais ao abrir o app (não depende de servidor pago). */
export function runNotificationChecks(input: {
  prefs: NotificationPrefs
  overduePayables: number
  dueSoonPayables: number
  pendingReceivables: number
  budgetRemainingCents: number
  budgetAvailableCents: number
}) {
  const last = localStorage.getItem(STORAGE_KEY)
  const now = Date.now()
  if (last && now - Number(last) < 1000 * 60 * 30) return
  localStorage.setItem(STORAGE_KEY, String(now))

  if (input.prefs.dueAccounts && input.dueSoonPayables > 0) {
    showLocalNotification(
      'Contas a vencer',
      `${input.dueSoonPayables} conta(s) vencem nos próximos dias.`,
      'due-soon',
    )
  }
  if (input.prefs.dueAccounts && input.overduePayables > 0) {
    showLocalNotification(
      'Contas vencidas',
      `${input.overduePayables} conta(s) em atraso.`,
      'overdue',
    )
  }
  if (input.prefs.pendingIncome && input.pendingReceivables > 0) {
    showLocalNotification(
      'Recebimentos pendentes',
      `Você tem ${input.pendingReceivables} recebimento(s) previsto(s) ainda não confirmado(s).`,
      'pending-income',
    )
  }
  if (
    input.prefs.budgetAlerts &&
    input.budgetAvailableCents > 0 &&
    input.budgetRemainingCents < input.budgetAvailableCents * 0.15
  ) {
    showLocalNotification(
      'Alerta de orçamento',
      'Seu orçamento pessoal está quase esgotado neste mês.',
      'budget-alert',
    )
  }
}

export function scheduleWeeklySummaryHint() {
  const day = new Date().getDay()
  const hour = new Date().getHours()
  if (day === 1 && hour >= 8 && hour < 10) {
    showLocalNotification(
      'Resumo semanal',
      'Abra o Meu Financeiro para ver receitas, despesas e metas da semana.',
      'weekly-summary',
    )
  }
}
