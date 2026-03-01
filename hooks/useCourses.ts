import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export const useCourses = (schoolId: string | undefined) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/courses', {
        params: { school_id: schoolId }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (courseData: any) => {
    try {
      const response = await apiClient.post('/courses', courseData);
      setCourses(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Failed to create course:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [schoolId]);

  return { courses, loading, fetchCourses, createCourse };
};
