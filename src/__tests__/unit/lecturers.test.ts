import { LECTURERS, isValidLecturer, isValidLecture, getLecturesForLecturer } from '@/lib/lecturers';

describe('Lecturers Data', () => {
  test('includes newly added lecturers and topics', () => {
    expect(isValidLecturer('Prof. Oluwasogo Dada')).toBe(true);
    expect(isValidLecture('Prof. Oluwasogo Dada', 'Principles of Answered prayers')).toBe(true);

    expect(isValidLecturer('Dr. Gbenga Owoeye')).toBe(true);
    expect(isValidLecture('Dr. Gbenga Owoeye', 'Principles of Divine Health')).toBe(true);

    expect(isValidLecturer('Dr. Oluwasegun omidiora')).toBe(true);
    expect(isValidLecture('Dr. Oluwasegun omidiora', 'covenant business startups')).toBe(true);

    expect(isValidLecturer('Pst. Charles Akporhonor')).toBe(true);
    expect(isValidLecture('Pst. Charles Akporhonor', 'Dynamics of Kingdom stewardship')).toBe(true);
  });

  test('returns correct lectures list for a lecturer', () => {
    expect(getLecturesForLecturer('Prof. Oluwasogo Dada')).toContain('Principles of Answered prayers');
    expect(getLecturesForLecturer('Dr. Gbenga Owoeye')).toEqual(['Principles of Divine Health']);
  });
});
