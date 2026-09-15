import { Category, Task } from '../types';

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'العمل', icon: 'Briefcase', colorHex: '#3B82F6', isDefault: true },
  { id: 'cat-2', name: 'الدراسة', icon: 'GraduationCap', colorHex: '#8B5CF6', isDefault: true },
  { id: 'cat-3', name: 'البرمجة', icon: 'Code', colorHex: '#10B981', isDefault: true },
  { id: 'cat-4', name: 'شخصي', icon: 'User', colorHex: '#F59E0B', isDefault: true },
  { id: 'cat-5', name: 'المنزل', icon: 'Home', colorHex: '#EF4444', isDefault: true },
  { id: 'cat-6', name: 'التسوق', icon: 'ShoppingCart', colorHex: '#EC4899', isDefault: true },
  { id: 'cat-7', name: 'الصحة واللياقة', icon: 'Heart', colorHex: '#06B6D4', isDefault: true },
  { id: 'cat-8', name: 'أخرى', icon: 'Folder', colorHex: '#64748B', isDefault: true }
];

export function getInitialSampleTasks(): Task[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return [
    {
      id: 'task-1',
      title: 'دراسة معمارية أندرويد وJetpack Compose',
      description: 'مراجعة الـ Coroutines وStateFlow ومحولات Room وتطبيق نمط Material 3',
      date: todayStr,
      startTime: '09:00',
      endTime: '10:30',
      priority: 'HIGH',
      status: 'PENDING',
      categoryId: 'cat-2',
      location: 'المكتبة / مساحة العمل',
      notes: 'التركيز على تفاعل Flow والتحقق من التحديث الفوري للبيانات المحلية',
      recurrence: { type: 'NONE', interval: 1, daysOfWeek: [] },
      reminder: 'MIN_15',
      createdAt: Date.now() - 3600000 * 5,
      updatedAt: Date.now() - 3600000 * 5,
      subtasks: [
        { id: 'sub-1', taskId: 'task-1', title: 'مراجعة ثيمات Material 3 في Compose', isCompleted: true, orderIndex: 0 },
        { id: 'sub-2', taskId: 'task-1', title: 'فحص واختبار استعلامات Room DAOs', isCompleted: true, orderIndex: 1 },
        { id: 'sub-3', taskId: 'task-1', title: 'تطبيق خوارزمية حساب تكرار المهام', isCompleted: false, orderIndex: 2 },
        { id: 'sub-4', taskId: 'task-1', title: 'كتابة اختبارات الوحدة Unit Tests', isCompleted: false, orderIndex: 3 }
      ]
    },
    {
      id: 'task-2',
      title: 'اجتماع فريق التطوير والإنتاجية',
      description: 'مراجعة بنية التطبيق ومزامنة خطة الإطلاق ومناقشة ميزات عدم الاتصال',
      date: todayStr,
      startTime: '11:00',
      endTime: '12:00',
      priority: 'HIGH',
      status: 'PENDING',
      categoryId: 'cat-1',
      location: 'قاعة الاجتماعات / Google Meet',
      notes: 'تقديم مقترح معمارية Offline-First للنقاش',
      recurrence: { type: 'WEEKLY', interval: 1, daysOfWeek: [2, 4] },
      reminder: 'MIN_10',
      createdAt: Date.now() - 3600000 * 4,
      updatedAt: Date.now() - 3600000 * 4,
      subtasks: []
    },
    {
      id: 'task-3',
      title: 'إنجاز معالم المشروع وتسليم النسخة',
      description: 'استكمال مخططات قواعد البيانات والتحقق من دعم الواجهة للغة العربية بالكامل',
      date: todayStr,
      startTime: '14:00',
      endTime: '16:00',
      priority: 'MEDIUM',
      status: 'PENDING',
      categoryId: 'cat-3',
      location: 'محطة العمل',
      notes: 'التأكد من اتساق النصوص والألوان ومطابقتها للمعايير',
      recurrence: { type: 'NONE', interval: 1, daysOfWeek: [] },
      reminder: 'AT_TIME',
      createdAt: Date.now() - 3600000 * 3,
      updatedAt: Date.now() - 3600000 * 3,
      subtasks: [
        { id: 'sub-5', taskId: 'task-3', title: 'فحص متصفح ملفات المشروع ومصادر كوتلن', isCompleted: true, orderIndex: 0 },
        { id: 'sub-6', taskId: 'task-3', title: 'ربط التنبيهات والإشعارات الدقيقة', isCompleted: true, orderIndex: 1 }
      ]
    },
    {
      id: 'task-4',
      title: 'تمرين رياضي ولياقة بدنية',
      description: '45 دقيقة تمارين لياقة وتمطيط بدني للراحة والاسترجاع',
      date: tomorrowStr,
      startTime: '07:30',
      endTime: '08:30',
      priority: 'MEDIUM',
      status: 'PENDING',
      categoryId: 'cat-7',
      location: 'النادي الرياضي',
      notes: 'شرب كمية وافرة من الماء قبل البدء',
      recurrence: { type: 'DAILY', interval: 1, daysOfWeek: [] },
      reminder: 'MIN_30',
      createdAt: Date.now() - 3600000 * 2,
      updatedAt: Date.now() - 3600000 * 2,
      subtasks: []
    },
    {
      id: 'task-5',
      title: 'قراءة في كتاب هندسة البرمجيات',
      description: 'قراءة الفصل الرابع: مبادئ المعمارية النظيفة Clean Architecture',
      date: todayStr,
      startTime: '20:00',
      endTime: '21:00',
      priority: 'LOW',
      status: 'PENDING',
      categoryId: 'cat-4',
      location: 'غرفة الجلوس',
      notes: 'تدوين ملخص لأهم الأنماط التصميمية',
      recurrence: { type: 'NONE', interval: 1, daysOfWeek: [] },
      reminder: 'MIN_5',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      subtasks: []
    },
    {
      id: 'task-6',
      title: 'تسوق المستلزمات الأسبوعية',
      description: 'شراء الخضار والفواكه والمؤن الطازجة للمنزل',
      date: yesterdayStr,
      startTime: '17:00',
      endTime: '18:00',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      completedAt: Date.now() - 86400000,
      categoryId: 'cat-6',
      location: 'السوق المركزي',
      notes: '',
      recurrence: { type: 'NONE', interval: 1, daysOfWeek: [] },
      reminder: 'NONE',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000,
      subtasks: [
        { id: 'sub-7', taskId: 'task-6', title: 'شراء الحليب والبيض والجبن', isCompleted: true, orderIndex: 0 },
        { id: 'sub-8', taskId: 'task-6', title: 'خضروات ورقية وفواكه طازجة', isCompleted: true, orderIndex: 1 }
      ]
    }
  ];
}
