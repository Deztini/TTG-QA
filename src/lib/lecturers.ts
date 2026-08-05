export interface LecturerData {
  name: string;
  lectures: string[];
}

export const LECTURERS: LecturerData[] = [
  {
    name: 'Prof. Adejumoke',
    lectures: [
      'Introduction to TTG',
      'Corporate Etiquette',
      'Preparing for the World of Works',
    ],
  },
  {
    name: 'Pst. Obed Onos',
    lectures: ['Vision Analysis', 'Faith Complex'],
  },
  {
    name: 'Dr. Henry',
    lectures: ['The Ministry of the Holy Spirit', 'Cultivating Christian Work Ethics'],
  },
  {
    name: 'Pst. Obaniyi Joseph',
    lectures: ['Dynamics of Spiritual Warfare', 'Word Dynamics'],
  },
  {
    name: 'Dr. Akinyomade',
    lectures: ['Plan, Programming, and Pursuit', 'Principles of Integrity'],
  },
  {
    name: 'Prof. Oluyori',
    lectures: ['Mentorship and Role Modelling', 'The Art of Peak Learning'],
  },
  {
    name: 'Prof. Ajanaku',
    lectures: ['Success Concepts', 'Principles of Work-Life Balance'],
  },
  {
    name: 'Prof. Oluwasogo Dada',
    lectures: ['Hard Work Works', 'Principles of Answered prayers'],
  },
  {
    name: 'Prof. Abiodun',
    lectures: ['Character Development'],
  },
  {
    name: 'Dr. Awe',
    lectures: ['Preparing for NYSC'],
  },
  {
    name: 'Dr. Gbenga Owoeye',
    lectures: ['Principles of Divine Health'],
  },
    {
    name: 'Dr. Olumoyewa Atoyebi',
    lectures: ['The Trap of Pride'],
  },
  {
    name: 'Dr. Oluwasegun omidiora',
    lectures: ['Covenant Business Startups', 'Dynamics of Spirituality'],
  },
  {
    name: 'Pst. Charles Akporhonor',
    lectures: ['Dynamics of Kingdom stewardship', 'The Supernatural'],
  },
];

export function getLecturesForLecturer(lecturerName: string): string[] {
  return LECTURERS.find((l) => l.name === lecturerName)?.lectures ?? [];
}

export function isValidLecturer(name: string): boolean {
  return LECTURERS.some((l) => l.name === name);
}

export function isValidLecture(lecturerName: string, lecture: string): boolean {
  return getLecturesForLecturer(lecturerName).includes(lecture);
}
