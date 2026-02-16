import {
  Button,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from '../components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://coachreflection.com'

interface TaskReminderEmailProps {
  name: string
  pendingCount: number
  highPriorityTasks: string[]
  overdueTasks: string[]
  unsubscribeUrl?: string
}

export function TaskReminderEmail({
  name,
  pendingCount,
  highPriorityTasks,
  overdueTasks,
  unsubscribeUrl,
}: TaskReminderEmailProps) {
  return (
    <BaseLayout
      preview={`You have ${pendingCount} pending coaching tasks`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={paragraph}>Hey {name},</Text>

      <Text style={paragraph}>
        You have <strong>{pendingCount} pending task{pendingCount !== 1 ? 's' : ''}</strong> from
        your coaching reflections.
      </Text>

      {overdueTasks.length > 0 && (
        <Section style={overdueBox}>
          <Text style={overdueTitle}>Overdue</Text>
          {overdueTasks.map((task, i) => (
            <Text key={i} style={taskItem}>
              {task}
            </Text>
          ))}
        </Section>
      )}

      {highPriorityTasks.length > 0 && (
        <Section style={highPriorityBox}>
          <Text style={highPriorityTitle}>High Priority</Text>
          {highPriorityTasks.map((task, i) => (
            <Text key={i} style={taskItem}>
              {task}
            </Text>
          ))}
        </Section>
      )}

      <Text style={paragraph}>
        Small actions compound. Tick one off today and your next session will be better for it.
      </Text>

      <Section style={buttonContainer}>
        <Button href={`${APP_URL}/dashboard/tasks`} style={button}>
          View Your Tasks
        </Button>
      </Section>
    </BaseLayout>
  )
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '16px 0',
}

const overdueBox = {
  backgroundColor: '#fef2f2',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #dc2626',
}

const overdueTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#dc2626',
  margin: '0 0 8px 0',
}

const highPriorityBox = {
  backgroundColor: '#fef3c7',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #E5A11C',
}

const highPriorityTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#92400e',
  margin: '0 0 8px 0',
}

const taskItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '4px 0',
  paddingLeft: '12px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#E5A11C',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}
