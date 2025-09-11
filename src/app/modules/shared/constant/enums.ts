export enum TypeClass {
  First = 'Klasa 1',
  Second = 'Klasa 2',
  Third = 'Klasa 3',
  Fourth = 'Klasa 4',
  Fifth = 'Klasa 5',
  Sixth = 'Klasa 6',
  Seventh = 'Klasa 7',
  Eighth = 'Klasa 8',
  Nineth = 'Klasa 9',
  Tenth = 'Klasa 10',
  Eleventh = 'Klasa 11',
  Twelveth = 'Klasa 12',
}

export enum Subjects {
  Literature = 'Letërsi',
  Mathematics = 'Matematik',
  English = 'Anglisht',
  History = 'Histori',
  Geography = 'Gjeografi',
  Science = 'Shkenca',
}

export enum Difficulty {
  Easy = 'Lehte',
  Medium = 'Mesem',
  Hard = 'Veshtir'
}

export enum UserRole {
  STUDENT = 'Student',
  FAMILY = 'Family',
  SUPERVIZOR = 'Supervizor',
  ADMIN = 'Admin'
}

export enum ProfileTabs {
  PersonalInfo = 1,
  ChangePassword = 2,
  SubscriptionDashboard = 3,
}

export enum NavigationDirection {
  NEXT = 'next',
  PREVIOUS = 'previous'
}

export enum ROUTES {
  ADMIN = '/admin/panel',
  STUDENT = '/student/dashboard',
  DEFAULT = ''
}

export enum BillingInterval {
  Day = 1,
  Week = 2,
  Month = 3,
  Year = 4
}
