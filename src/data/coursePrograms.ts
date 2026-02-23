import type { CourseProgram } from '../types/student';

export const COURSE_PROGRAMS: CourseProgram[] = [
  // ═══ Course 1: Original Mechatronics ═══
  {
    id: 'mech301',
    code: 'MECH 301',
    title: 'Introduction to Mechatronics Engineering',
    description:
      'Interdisciplinary study integrating mechanical, electrical, and computer engineering for smart system design. Covers sensors, actuators, microcontrollers, control systems, and system integration.',
    color: 'indigo',
    icon: 'Cpu',
    semester: 'Spring 2026',
    totalWeeks: 14,
    weekModules: [
      { week: 1, title: 'Foundations of Mechatronics', topics: ['System thinking', 'Interdisciplinary integration', 'Mechatronic system architecture'], status: 'completed', score: 88, completedAt: '2026-01-16' },
      { week: 2, title: 'Sensors & Transducers', topics: ['Sensor types', 'Signal conditioning', 'Calibration techniques'], status: 'completed', score: 75, completedAt: '2026-01-23' },
      { week: 3, title: 'Actuators & Drive Systems', topics: ['DC motors', 'Stepper motors', 'Servo mechanisms', 'Pneumatic systems'], status: 'completed', score: 82, completedAt: '2026-01-30' },
      { week: 4, title: 'Microcontroller Programming', topics: ['Arduino platform', 'Digital I/O', 'Analog reads', 'PWM control'], status: 'completed', score: 91, completedAt: '2026-02-06' },
      { week: 5, title: 'Control Systems Fundamentals', topics: ['Open-loop vs closed-loop', 'PID controllers', 'System modeling'], status: 'completed', score: 73, completedAt: '2026-02-13' },
      { week: 6, title: 'Signal Processing & Data Acquisition', topics: ['ADC/DAC', 'Filtering techniques', 'Sampling theory', 'Real-time data'], status: 'current' },
      { week: 7, title: 'Communication Protocols', topics: ['I2C', 'SPI', 'UART', 'Wireless protocols'], status: 'locked' },
      { week: 8, title: 'System Integration', topics: ['Hardware-software interface', 'Debugging strategies', 'Testing methodology'], status: 'locked' },
      { week: 9, title: 'Embedded Systems Design', topics: ['RTOS concepts', 'Memory management', 'Power optimization'], status: 'locked' },
      { week: 10, title: 'Human-Machine Interfaces', topics: ['Display systems', 'Input devices', 'Ergonomic design', 'UX for embedded'], status: 'locked' },
      { week: 11, title: 'Industrial Applications', topics: ['Robotics', 'Automation', 'Quality control systems'], status: 'locked' },
      { week: 12, title: 'Advanced Topics', topics: ['Machine learning on edge', 'IoT integration', 'Cloud connectivity'], status: 'locked' },
      { week: 13, title: 'Project Presentations', topics: ['Technical presentation', 'Demo day', 'Peer review'], status: 'locked' },
      { week: 14, title: 'Final Submission & Reflection', topics: ['Portfolio compilation', 'Self-assessment', 'Course reflection'], status: 'locked' },
    ],
    skills: [
      { name: 'Circuit Design', score: 78, trend: 'up' },
      { name: 'Programming (C/C++)', score: 85, trend: 'up' },
      { name: 'Sensor Integration', score: 62, trend: 'stable' },
      { name: 'Control Systems', score: 70, trend: 'up' },
      { name: 'Mechanical Design', score: 55, trend: 'down' },
      { name: 'Signal Processing', score: 68, trend: 'stable' },
    ],
  },

  // ═══ Course 2: Digital Signal Processing ═══
  {
    id: 'ece420',
    code: 'ECE 420',
    title: 'Digital Signal Processing',
    description:
      'Theory and application of digital signal processing including discrete-time signals, DFT, FFT, FIR/IIR filter design, and real-time DSP implementation on hardware platforms.',
    color: 'emerald',
    icon: 'Activity',
    semester: 'Spring 2026',
    totalWeeks: 14,
    weekModules: [
      { week: 1, title: 'Discrete-Time Signals & Systems', topics: ['Sampling theorem', 'Quantization', 'Discrete convolution'], status: 'completed', score: 80, completedAt: '2026-01-16' },
      { week: 2, title: 'Z-Transform & Transfer Functions', topics: ['Z-transform properties', 'Inverse Z-transform', 'System characterization'], status: 'completed', score: 72, completedAt: '2026-01-23' },
      { week: 3, title: 'Discrete Fourier Transform', topics: ['DFT definition', 'Frequency resolution', 'Spectral leakage', 'Windowing'], status: 'completed', score: 85, completedAt: '2026-01-30' },
      { week: 4, title: 'Fast Fourier Transform', topics: ['Radix-2 FFT', 'Computational complexity', 'Real-time spectrum analysis'], status: 'completed', score: 78, completedAt: '2026-02-06' },
      { week: 5, title: 'FIR Filter Design', topics: ['Window method', 'Parks-McClellan algorithm', 'Linear phase filters'], status: 'completed', score: 70, completedAt: '2026-02-13' },
      { week: 6, title: 'IIR Filter Design', topics: ['Butterworth filters', 'Chebyshev filters', 'Bilinear transform'], status: 'current' },
      { week: 7, title: 'Multi-Rate Signal Processing', topics: ['Decimation', 'Interpolation', 'Polyphase filters'], status: 'locked' },
      { week: 8, title: 'Adaptive Filters', topics: ['LMS algorithm', 'RLS algorithm', 'Noise cancellation'], status: 'locked' },
      { week: 9, title: 'Statistical Signal Processing', topics: ['Power spectral density', 'Correlation functions', 'Wiener filters'], status: 'locked' },
      { week: 10, title: 'DSP Hardware Implementation', topics: ['Fixed-point arithmetic', 'DSP processor architecture', 'Code optimization'], status: 'locked' },
      { week: 11, title: 'Audio Signal Processing', topics: ['Audio codecs', 'Equalization', 'Effects processing'], status: 'locked' },
      { week: 12, title: 'Image Processing Basics', topics: ['2D transforms', 'Spatial filtering', 'Edge detection'], status: 'locked' },
      { week: 13, title: 'Project Presentations', topics: ['DSP project demo', 'Performance analysis', 'Peer review'], status: 'locked' },
      { week: 14, title: 'Final Exam & Reflection', topics: ['Comprehensive review', 'Self-assessment'], status: 'locked' },
    ],
    skills: [
      { name: 'Frequency Analysis', score: 82, trend: 'up' },
      { name: 'Filter Design', score: 70, trend: 'up' },
      { name: 'MATLAB/Python DSP', score: 88, trend: 'up' },
      { name: 'Mathematical Modeling', score: 74, trend: 'stable' },
      { name: 'Real-Time Implementation', score: 58, trend: 'stable' },
      { name: 'Signal Theory', score: 76, trend: 'up' },
    ],
  },

  // ═══ Course 3: Embedded Systems ═══
  {
    id: 'cse460',
    code: 'CSE 460',
    title: 'Embedded Systems & IoT',
    description:
      'Design of resource-constrained computing systems including RTOS, peripheral interfaces, wireless communication, low-power design, and IoT cloud integration.',
    color: 'amber',
    icon: 'Microchip',
    semester: 'Spring 2026',
    totalWeeks: 14,
    weekModules: [
      { week: 1, title: 'Embedded Computing Fundamentals', topics: ['Von Neumann vs Harvard', 'Memory hierarchy', 'Cross-compilation'], status: 'completed', score: 92, completedAt: '2026-01-16' },
      { week: 2, title: 'ARM Cortex-M Architecture', topics: ['Register set', 'Exception handling', 'NVIC configuration'], status: 'completed', score: 84, completedAt: '2026-01-23' },
      { week: 3, title: 'Peripheral Programming', topics: ['GPIO', 'Timers', 'Interrupts', 'DMA controllers'], status: 'completed', score: 88, completedAt: '2026-01-30' },
      { week: 4, title: 'Serial Communication', topics: ['UART', 'SPI', 'I2C', 'Protocol analysis'], status: 'completed', score: 79, completedAt: '2026-02-06' },
      { week: 5, title: 'Real-Time Operating Systems', topics: ['FreeRTOS', 'Task scheduling', 'Semaphores', 'Mutexes'], status: 'completed', score: 71, completedAt: '2026-02-13' },
      { week: 6, title: 'Low-Power Design', topics: ['Sleep modes', 'Clock gating', 'Power budgeting', 'Energy harvesting'], status: 'current' },
      { week: 7, title: 'Wireless Protocols', topics: ['BLE', 'WiFi', 'LoRa', 'Zigbee'], status: 'locked' },
      { week: 8, title: 'IoT Cloud Platforms', topics: ['MQTT', 'AWS IoT', 'Data pipelines', 'Edge computing'], status: 'locked' },
      { week: 9, title: 'Sensor Fusion', topics: ['Kalman filtering', 'IMU integration', 'Multi-sensor data fusion'], status: 'locked' },
      { week: 10, title: 'Security in Embedded Systems', topics: ['Secure boot', 'Encryption on MCU', 'OTA updates'], status: 'locked' },
      { week: 11, title: 'Testing & Debugging', topics: ['JTAG/SWD', 'Logic analyzers', 'Unit testing embedded'], status: 'locked' },
      { week: 12, title: 'Product Design Lifecycle', topics: ['PCB layout basics', 'Enclosure design', 'Certification'], status: 'locked' },
      { week: 13, title: 'Project Demo', topics: ['Working prototype', 'Technical presentation', 'Code review'], status: 'locked' },
      { week: 14, title: 'Final Submission', topics: ['Documentation', 'Portfolio', 'Reflection'], status: 'locked' },
    ],
    skills: [
      { name: 'ARM Programming', score: 86, trend: 'up' },
      { name: 'RTOS Design', score: 71, trend: 'up' },
      { name: 'Peripheral Interfaces', score: 83, trend: 'up' },
      { name: 'Low-Power Design', score: 60, trend: 'stable' },
      { name: 'Wireless Protocols', score: 52, trend: 'stable' },
      { name: 'Debugging & Testing', score: 75, trend: 'up' },
    ],
  },

  // ═══ Course 4: Robotics & Autonomous Systems ═══
  {
    id: 'me544',
    code: 'ME 544',
    title: 'Robotics & Autonomous Systems',
    description:
      'Fundamentals of robotic systems including kinematics, dynamics, path planning, computer vision, and autonomous navigation for mobile robots and manipulators.',
    color: 'rose',
    icon: 'Bot',
    semester: 'Spring 2026',
    totalWeeks: 14,
    weekModules: [
      { week: 1, title: 'Introduction to Robotics', topics: ['Robot classification', 'Degrees of freedom', 'Workspace analysis'], status: 'completed', score: 90, completedAt: '2026-01-16' },
      { week: 2, title: 'Rigid Body Transformations', topics: ['Rotation matrices', 'Homogeneous transforms', 'DH parameters'], status: 'completed', score: 68, completedAt: '2026-01-23' },
      { week: 3, title: 'Forward & Inverse Kinematics', topics: ['Analytical solutions', 'Numerical methods', 'Jacobian matrix'], status: 'completed', score: 72, completedAt: '2026-01-30' },
      { week: 4, title: 'Robot Dynamics', topics: ['Lagrangian mechanics', 'Newton-Euler method', 'Dynamic simulation'], status: 'completed', score: 65, completedAt: '2026-02-06' },
      { week: 5, title: 'Motion Planning', topics: ['Configuration space', 'RRT/PRM algorithms', 'Trajectory optimization'], status: 'completed', score: 77, completedAt: '2026-02-13' },
      { week: 6, title: 'Computer Vision for Robotics', topics: ['Camera calibration', 'Feature detection', 'Object recognition'], status: 'current' },
      { week: 7, title: 'Sensor-Based Navigation', topics: ['LIDAR', 'SLAM', 'Occupancy grids'], status: 'locked' },
      { week: 8, title: 'Robot Control Architectures', topics: ['Reactive control', 'Behavior-based control', 'Hybrid architectures'], status: 'locked' },
      { week: 9, title: 'Manipulation & Grasping', topics: ['Grasp planning', 'Force control', 'Compliance'], status: 'locked' },
      { week: 10, title: 'Multi-Robot Systems', topics: ['Swarm intelligence', 'Task allocation', 'Communication'], status: 'locked' },
      { week: 11, title: 'Machine Learning for Robotics', topics: ['Reinforcement learning', 'Imitation learning', 'Sim-to-real'], status: 'locked' },
      { week: 12, title: 'ROS Framework', topics: ['ROS2 basics', 'Nodes and topics', 'Gazebo simulation'], status: 'locked' },
      { week: 13, title: 'Project Demo', topics: ['Robot demonstration', 'Performance metrics', 'Peer evaluation'], status: 'locked' },
      { week: 14, title: 'Final Submission', topics: ['Technical report', 'Video documentation', 'Reflection'], status: 'locked' },
    ],
    skills: [
      { name: 'Kinematics & Dynamics', score: 70, trend: 'up' },
      { name: 'Motion Planning', score: 77, trend: 'up' },
      { name: 'Computer Vision', score: 60, trend: 'stable' },
      { name: 'Robot Programming', score: 82, trend: 'up' },
      { name: 'Mathematical Foundations', score: 68, trend: 'stable' },
      { name: 'System Integration', score: 65, trend: 'up' },
    ],
  },
];

export function getCourseById(id: string): CourseProgram | undefined {
  return COURSE_PROGRAMS.find((c) => c.id === id);
}

export function getCoursesByIds(ids: string[]): CourseProgram[] {
  return ids.map((id) => COURSE_PROGRAMS.find((c) => c.id === id)).filter(Boolean) as CourseProgram[];
}
