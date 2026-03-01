// types/roles.ts
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export enum Permission {
  CREATE_COURSES = 'create_courses',
  EDIT_COURSES = 'edit_courses',
  DELETE_COURSES = 'delete_courses',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [],
  [UserRole.TEACHER]: [
    Permission.CREATE_COURSES,
    Permission.EDIT_COURSES
  ],
  [UserRole.MODERATOR]: [
    Permission.EDIT_COURSES,
    Permission.MANAGE_USERS
  ],
  [UserRole.ADMIN]: Object.values(Permission)
};