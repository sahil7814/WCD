import { ClipboardPlus, FileText, LayoutDashboard, Users } from 'lucide-react'

export function getSidebarMenuItems(user, translate) {
  const items = [
    { to: '/dashboard', label: translate('dashboard'), icon: LayoutDashboard }
  ]

  if (user.role === 'ADMIN') {
    items.push(
      { to: '/applications', label: translate('applications'), icon: FileText },
      { to: '/admin/employees', label: translate('employeeManagement'), icon: Users }
    )
  } else {
    items.push(
      { to: '/applications/new', label: translate('newApplication'), icon: ClipboardPlus },
      { to: '/applications', label: translate('applications'), icon: FileText }
    )
  }

  return items
}
