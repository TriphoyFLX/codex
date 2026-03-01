import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { apiClient } from "../../lib/apiClient";
import styles from './Tasks.module.css';

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  created_by: string;
  type: string;
  points: number;
  course_id: string | null;
  class_id: number | null;
  attachments: any[];
  status: string;
  creator_first_name?: string;
  creator_last_name?: string;
  course_title?: string;
  is_submitted?: boolean;
  submission_status?: string;
  submission_grade?: number;
  submission_date?: string;
  submission_id?: string;
  submission_content?: string;
  submission_attachments?: any[];
}

interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  content: string;
  attachments: any[];
  status: 'pending' | 'submitted' | 'graded' | 'rejected';
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at?: string;
  graded_by?: string;
  student_name?: string;
  student_class?: number;
  first_name?: string;
  last_name?: string;
}

interface CreateTaskData {
  title: string;
  description: string;
  type: string;
  points: number;
  dueDate: string;
  courseId?: string;
  classId?: number;
  attachments?: any[];
  assignedStudents?: string[];
}

const Tasks: React.FC = () => {
  const { profile } = useProfile();
  const { addQuizResult, getUserStats, loadUserResults } = useLeaderboard();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<{ completed: number; points: number }>({ completed: 0, points: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSubmissionsList, setShowSubmissionsList] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, TaskSubmission>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'homework',
    points: 100,
    dueDate: '',
    courseId: '',
    classId: '',
    assignedStudents: ''
  });
  const [submitData, setSubmitData] = useState({
    content: '',
    attachments: [] as any[]
  });
  const [reviewData, setReviewData] = useState({
    grade: 0,
    feedback: '',
    status: 'graded' as 'graded' | 'rejected'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Проверка роли
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  const isStudent = profile?.role === 'student';

  useEffect(() => {
    fetchTasks();
  }, []);

  // Загружаем статистику пользователя
  useEffect(() => {
    if (profile?.id) {
      // Считаем баллы только из оцененных заданий (без тестов)
      const taskPoints = tasks
        .filter(task => 
          task.submission_grade !== null && 
          task.submission_grade !== undefined &&
          task.is_submitted // Только отправленные задания
        )
        .reduce((total, task) => total + (task.submission_grade || 0), 0);
      
      console.log('Task points calculated:', taskPoints);
      console.log('Tasks with grades:', tasks.filter(t => t.submission_grade !== null));
      
      // Синхронизируем существующие оцененные задания с лидербордом
      const existingResults = loadUserResults(profile.id);
      tasks.forEach(task => {
        if (task.submission_grade !== null && 
            task.submission_grade !== undefined &&
            task.is_submitted &&
            profile?.id) {
          // Проверяем, нет ли уже такого результата
          const existingResult = existingResults.find((r: any) => r.quiz_id === `task-${task.id}`);
          if (!existingResult) {
            addQuizResult({
              user_id: profile.id,
              username: profile.username || profile.email || 'Student',
              quiz_id: `task-${task.id}`,
              score: task.submission_grade,
              max_score: task.points,
              completed_at: task.submission_date || new Date().toISOString()
            });
            console.log('Synced existing task result to leaderboard:', {
              user_id: profile.id,
              task_id: task.id,
              score: task.submission_grade,
              max_score: task.points
            });
          }
        }
      });

      // Показываем общие баллы из лидерборда (включая тесты и задания)
      const userStatsData = getUserStats(profile.id);
      setUserStats({
        completed: tasks.filter(t => t.submission_grade !== null).length, // Количество оцененных заданий
        points: userStatsData?.user_points || taskPoints // Общие баллы из лидерборда или баллы за задания
      });
    }
  }, [profile?.id, tasks]); // Убрали getUserStats из зависимостей

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching tasks with apiClient');
      
      const response = await apiClient.get('/tasks');
      
      console.log('Tasks loaded:', response.data);
      setTasks(response.data);

      // Если ученик, загружаем статусы отправок
      if (isStudent) {
        const submissionsMap: Record<string, TaskSubmission> = {};
        response.data.forEach((task: Task) => {
          if (task.submission_id) {
            submissionsMap[task.id] = {
              id: task.submission_id,
              task_id: task.id,
              student_id: profile?.id || '',
              content: task.submission_content || '',
              attachments: task.submission_attachments || [],
              status: (task.submission_status as any) || 'submitted',
              grade: task.submission_grade || null,
              feedback: null,
              submitted_at: task.submission_date || ''
            };
          }
        });
        setSubmissions(submissionsMap);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Требуется авторизация. Пожалуйста, войдите снова.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(error.response?.data?.error || 'Не удалось загрузить задания');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskSubmissions = async (taskId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/tasks/${taskId}/submissions`);
      setTaskSubmissions(response.data);
      setShowSubmissionsList(true);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      setError(error.response?.data?.error || 'Не удалось загрузить решения');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setShowCreateModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      description: '',
      type: 'homework',
      points: 100,
      dueDate: '',
      courseId: '',
      classId: '',
      assignedStudents: ''
    });
    setError(null);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);

      const taskData: CreateTaskData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        points: Number(formData.points),
        dueDate: formData.dueDate,
        attachments: []
      };

      if (formData.courseId) {
        taskData.courseId = formData.courseId;
      }

      if (formData.classId) {
        taskData.classId = Number(formData.classId);
      }

      if (formData.assignedStudents) {
        taskData.assignedStudents = formData.assignedStudents
          .split(',')
          .map(id => id.trim())
          .filter(id => id);
      }

      console.log('Creating task with data:', taskData);

      const response = await apiClient.post('/tasks', taskData);
      
      console.log('Task created:', response.data);
      
      setTasks(prev => [response.data, ...prev]);
      setSuccess('Задание успешно создано');
      setTimeout(() => setSuccess(null), 3000);
      handleCloseModal();
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(error.response?.data?.error || 'Не удалось создать задание');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenSubmitModal = (task: Task) => {
    if (submissions[task.id]?.status === 'submitted' || submissions[task.id]?.status === 'graded') {
      setSelectedTask(task);
      setShowSubmitModal(true);
      setSubmitData({ content: '', attachments: [] });
      setError(null);
      return;
    }
    setSelectedTask(task);
    setShowSubmitModal(true);
    setSubmitData({ content: '', attachments: [] });
    setError(null);
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
    setSelectedTask(null);
    setSubmitData({ content: '', attachments: [] });
    setError(null);
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTask) {
      console.error('No selected task');
      return;
    }

    try {
      setError(null);
      console.log('=== Submitting solution ===');
      console.log('Task ID:', selectedTask.id);
      console.log('Submit data:', submitData);
      console.log('User profile:', profile);
      
      // Проверяем наличие токена перед отправкой
      const token = localStorage.getItem('auth_token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        setError('Требуется авторизация. Пожалуйста, войдите снова.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const response = await apiClient.post(`/tasks/${selectedTask.id}/submit`, {
        content: submitData.content,
        attachments: submitData.attachments
      });
      
      console.log('Submission response:', response.data);
      
      setSubmissions(prev => ({
        ...prev,
        [selectedTask.id]: response.data
      }));

      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, is_submitted: true, submission_status: 'submitted' }
          : task
      ));

      setSuccess('Задание успешно отправлено');
      setTimeout(() => setSuccess(null), 3000);
      handleCloseSubmitModal();
    } catch (error: any) {
      console.error('=== Error submitting task ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        setError('Нет доступа к этому заданию');
      } else if (error.response?.status === 400) {
        setError(error.response?.data?.error || 'Неверные данные для отправки');
      } else {
        setError(error.response?.data?.error || 'Не удалось отправить задание');
      }
    }
  };

  const handleSubmitInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSubmitData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenReviewModal = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
    setReviewData({
      grade: submission.grade || 0,
      feedback: submission.feedback || '',
      status: 'graded'
    });
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedSubmission(null);
    setReviewData({
      grade: 0,
      feedback: '',
      status: 'graded'
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;

    try {
      setError(null);

      const response = await apiClient.post(`/tasks/submissions/${selectedSubmission.id}/grade`, {
        grade: reviewData.grade,
        feedback: reviewData.feedback
      });
      
      console.log('Submission graded:', response.data);
      
      // Обновляем список решений
      setTaskSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, grade: reviewData.grade, feedback: reviewData.feedback, status: 'graded' }
          : sub
      ));

      // Обновляем список задач с новой оценкой
      setTasks(prev => prev.map(task => 
        task.id === selectedSubmission.task_id 
          ? { ...task, submission_grade: reviewData.grade, submission_status: 'graded' }
          : task
      ));

      // Добавляем результат задания в лидерборд
      if (profile && selectedSubmission.task_id) {
        const gradedTask = tasks.find(t => t.id === selectedSubmission.task_id);
        if (gradedTask) {
          addQuizResult({
            user_id: profile.id,
            username: profile.username || profile.email || 'Student',
            quiz_id: `task-${selectedSubmission.task_id}`,
            score: reviewData.grade,
            max_score: gradedTask.points,
            completed_at: new Date().toISOString()
          });
          console.log('Added task result to leaderboard:', {
            user_id: profile.id,
            task_id: selectedSubmission.task_id,
            score: reviewData.grade,
            max_score: gradedTask.points
          });
        }
      }

      setSuccess('Решение оценено');
      setTimeout(() => setSuccess(null), 3000);
      handleCloseReviewModal();
    } catch (error: any) {
      console.error('Error grading submission:', error);
      setError(error.response?.data?.error || 'Не удалось оценить решение');
    }
  };

  const handleReviewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReviewData(prev => ({ ...prev, [name]: name === 'grade' ? Number(value) : value }));
  };

  const getTaskStatus = (task: Task) => {
    if (!isStudent) return null;
    
    const submission = submissions[task.id];
    if (!submission) {
      return new Date(task.due_date) < new Date() ? 'overdue' : 'pending';
    }
    return submission.status;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Ожидает отправки',
      'submitted': 'Отправлено',
      'graded': 'Проверено',
      'rejected': 'Отклонено',
      'overdue': 'Просрочено'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      'pending': styles.statusPending,
      'submitted': styles.statusSubmitted,
      'graded': styles.statusGraded,
      'rejected': styles.statusRejected,
      'overdue': styles.statusOverdue
    };
    return classMap[status] || '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Задания</h1>
        {isStudent && (
          <div className={styles.userStats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏆</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{userStats.points}</div>
                <div className={styles.statLabel}>Баллов за задания</div>
              </div>
            </div>
          </div>
        )}
        {isTeacher && (
          <button 
            className={styles.createButton}
            onClick={handleCreateTask}
          >
            + Создать задание
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.tasksGrid}>
          {tasks.length > 0 ? (
            tasks.map(task => {
              const taskStatus = getTaskStatus(task);
              return (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    {isStudent && taskStatus && (
                      <span className={`${styles.statusBadge} ${getStatusClass(taskStatus)}`}>
                        {getStatusText(taskStatus)}
                      </span>
                    )}
                    {isStudent && submissions[task.id]?.grade !== null && (
                      <span className={styles.gradeBadge}>
                        Оценка: {submissions[task.id]?.grade}
                      </span>
                    )}
                  </div>
                  
                  <p className={styles.taskDescription}>{task.description}</p>
                  
                  <div className={styles.taskMeta}>
                    <span className={styles.points}>Баллов: {task.points}</span>
                    <span className={styles.dueDate}>
                      Срок: {new Date(task.due_date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  
                  {task.course_title && (
                    <div className={styles.taskMeta}>
                      <span className={styles.courseName}>{task.course_title}</span>
                    </div>
                  )}
                  
                  {isTeacher && task.creator_first_name && (
                    <div className={styles.taskMeta}>
                      <span>Автор: {task.creator_first_name} {task.creator_last_name}</span>
                    </div>
                  )}
                  
                  <div className={styles.taskFooter}>
                    {isTeacher && (
                      <button 
                        className={styles.viewSubmissionsButton}
                        onClick={() => fetchTaskSubmissions(task.id)}
                      >
                        Просмотреть решения
                      </button>
                    )}
                    
                    {isStudent && taskStatus === 'pending' && (
                      <button 
                        className={styles.submitButton}
                        onClick={() => handleOpenSubmitModal(task)}
                      >
                        Отправить решение
                      </button>
                    )}
                    
                    {isStudent && taskStatus === 'overdue' && (
                      <button 
                        className={styles.submitButtonDisabled}
                        disabled
                      >
                        Просрочено
                      </button>
                    )}
                    
                    {isStudent && (taskStatus === 'submitted' || taskStatus === 'graded' || taskStatus === 'rejected') && (
                      <button 
                        className={styles.viewButton}
                        onClick={() => handleOpenSubmitModal(task)}
                      >
                        {taskStatus === 'graded' ? 'Результат' : 'Просмотр'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              {isTeacher 
                ? 'Нет созданных заданий. Создайте первое задание!' 
                : 'Нет доступных заданий'}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно создания задания */}
      {showCreateModal && isTeacher && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Создать новое задание</h2>
            <form onSubmit={handleSubmitTask} className={styles.createForm}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Название задания *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={styles.input}
                  placeholder="Введите название"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Описание *</label>
                <textarea
                  id="description"
                  name="description"
                  className={styles.textarea}
                  placeholder="Опишите задание"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="type">Тип задания</label>
                  <select
                    id="type"
                    name="type"
                    className={styles.select}
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="homework">Домашнее задание</option>
                    <option value="project">Проект</option>
                    <option value="test">Тест</option>
                    <option value="quiz">Квиз</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="points">Макс. баллов</label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    className={styles.input}
                    min="0"
                    max="1000"
                    value={formData.points}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="dueDate">Срок сдачи *</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    className={styles.input}
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="class">Класс</label>
                  <select
                    id="class"
                    name="classId"
                    className={styles.select}
                    value={formData.classId}
                    onChange={handleInputChange}
                  >
                    <option value="">Все классы</option>
                    <option value="5">5 класс</option>
                    <option value="6">6 класс</option>
                    <option value="7">7 класс</option>
                    <option value="8">8 класс</option>
                    <option value="9">9 класс</option>
                    <option value="10">10 класс</option>
                    <option value="11">11 класс</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="courseId">ID курса (необязательно)</label>
                <input
                  type="text"
                  id="courseId"
                  name="courseId"
                  className={styles.input}
                  placeholder="Введите ID курса"
                  value={formData.courseId}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="assignedStudents">
                  ID учеников (через запятую, необязательно)
                </label>
                <input
                  type="text"
                  id="assignedStudents"
                  name="assignedStudents"
                  className={styles.input}
                  placeholder="uuid1, uuid2, uuid3"
                  value={formData.assignedStudents}
                  onChange={handleInputChange}
                />
                <small className={styles.hint}>
                  Если не указано, задание будет доступно всем ученикам указанного класса
                </small>
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.submitButton}>
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно отправки задания */}
      {showSubmitModal && selectedTask && isStudent && (
        <div className={styles.modalOverlay} onClick={handleCloseSubmitModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {submissions[selectedTask.id]?.status === 'graded' 
                ? 'Результат задания' 
                : submissions[selectedTask.id]?.status === 'submitted'
                ? 'Просмотр отправки'
                : 'Отправить задание'}
            </h2>
            
            <div className={styles.taskInfo}>
              <h3>{selectedTask.title}</h3>
              <p>{selectedTask.description}</p>
              <p className={styles.dueDate}>
                Срок: {new Date(selectedTask.due_date).toLocaleDateString('ru-RU')}
              </p>
              <p className={styles.points}>Макс. баллов: {selectedTask.points}</p>
            </div>

            {submissions[selectedTask.id]?.status === 'graded' ? (
              <div className={styles.gradeInfo}>
                <div className={styles.gradeBox}>
                  <span className={styles.gradeLabel}>Оценка:</span>
                  <span className={styles.gradeValue}>{submissions[selectedTask.id]?.grade}</span>
                  <span className={styles.maxPoints}> / {selectedTask.points}</span>
                </div>
                {submissions[selectedTask.id]?.feedback && (
                  <div className={styles.feedbackBox}>
                    <span className={styles.feedbackLabel}>Комментарий учителя:</span>
                    <p className={styles.feedbackText}>{submissions[selectedTask.id]?.feedback}</p>
                  </div>
                )}
                <div className={styles.submissionInfo}>
                  <span>Отправлено: {new Date(submissions[selectedTask.id]?.submitted_at).toLocaleString('ru-RU')}</span>
                </div>
                <div className={styles.submissionContent}>
                  <h4>Ваш ответ:</h4>
                  <p>{submissions[selectedTask.id]?.content}</p>
                </div>
                <button className={styles.closeButton} onClick={handleCloseSubmitModal}>
                  Закрыть
                </button>
              </div>
            ) : submissions[selectedTask.id]?.status === 'submitted' ? (
              <div className={styles.submissionView}>
                <div className={styles.submissionContent}>
                  <h4>Ваш ответ:</h4>
                  <p>{submissions[selectedTask.id]?.content}</p>
                </div>
                <div className={styles.submissionInfo}>
                  <span>Отправлено: {new Date(submissions[selectedTask.id]?.submitted_at).toLocaleString('ru-RU')}</span>
                </div>
                <p className={styles.pendingMessage}>Ожидает проверки учителем</p>
                <button className={styles.closeButton} onClick={handleCloseSubmitModal}>
                  Закрыть
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitSolution} className={styles.submitForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="content">Ваш ответ *</label>
                  <textarea
                    id="content"
                    name="content"
                    className={styles.textarea}
                    placeholder="Напишите ваш ответ здесь..."
                    rows={8}
                    value={submitData.content}
                    onChange={handleSubmitInputChange}
                    required
                  />
                </div>
                
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={handleCloseSubmitModal}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Отправить на проверку
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно со списком решений (для учителя) */}
      {showSubmissionsList && isTeacher && (
        <div className={styles.modalOverlay} onClick={() => setShowSubmissionsList(false)}>
          <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Решения учеников</h2>
            
            {taskSubmissions.length === 0 ? (
              <p className={styles.emptyMessage}>Пока нет отправленных решений</p>
            ) : (
              <div className={styles.submissionsList}>
                {taskSubmissions.map(submission => (
                  <div key={submission.id} className={styles.submissionItem}>
                    <div className={styles.submissionHeader}>
                      <span className={styles.studentName}>
                        {submission.first_name} {submission.last_name}
                      </span>
                      <span className={`${styles.submissionStatus} ${getStatusClass(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                    
                    <div className={styles.submissionPreview}>
                      <p className={styles.submissionContent}>
                        {submission.content.length > 100 
                          ? submission.content.substring(0, 100) + '...' 
                          : submission.content}
                      </p>
                    </div>
                    
                    <div className={styles.submissionMeta}>
                      <span>Отправлено: {new Date(submission.submitted_at).toLocaleString('ru-RU')}</span>
                      {submission.grade !== null && (
                        <span className={styles.submissionGrade}>Оценка: {submission.grade}</span>
                      )}
                    </div>
                    
                    <button 
                      className={styles.reviewButton}
                      onClick={() => handleOpenReviewModal(submission)}
                    >
                      {submission.status === 'graded' ? 'Изменить оценку' : 'Оценить'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className={styles.closeButton}
              onClick={() => setShowSubmissionsList(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно оценки решения (для учителя) */}
      {showReviewModal && selectedSubmission && isTeacher && (
        <div className={styles.modalOverlay} onClick={handleCloseReviewModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Оценка решения</h2>
            
            <div className={styles.reviewInfo}>
              <p><strong>Ученик:</strong> {selectedSubmission.first_name} {selectedSubmission.last_name}</p>
              <p><strong>Отправлено:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString('ru-RU')}</p>
            </div>
            
            <div className={styles.reviewContent}>
              <h4>Ответ ученика:</h4>
              <div className={styles.studentAnswer}>
                {selectedSubmission.content}
              </div>
            </div>
            
            <form onSubmit={handleReviewSubmit} className={styles.reviewForm}>
              <div className={styles.formGroup}>
                <label htmlFor="grade">Оценка (баллы) *</label>
                <input
                  type="number"
                  id="grade"
                  name="grade"
                  className={styles.input}
                  min="0"
                  max="100"
                  value={reviewData.grade}
                  onChange={handleReviewInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="feedback">Комментарий</label>
                <textarea
                  id="feedback"
                  name="feedback"
                  className={styles.textarea}
                  placeholder="Напишите комментарий для ученика..."
                  rows={4}
                  value={reviewData.feedback}
                  onChange={handleReviewInputChange}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleCloseReviewModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.submitButton}>
                  {selectedSubmission.status === 'graded' ? 'Обновить оценку' : 'Поставить оценку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;