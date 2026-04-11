const topics = [
  {
    id: "linear-motion",
    title: "Linear Motion Basics",
    slug: "linear-motion",
    level: "Senior 1",
    duration: "12 min",
    category: "Mechanics",
    summary:
      "Study distance, displacement, speed, and velocity using everyday motion examples and adjustable values.",
    objectives: [
      "Differentiate distance from displacement",
      "Use velocity and acceleration in a straight-line motion model",
      "Interpret how changing time affects motion",
    ],
    lesson: {
      overview:
        "Linear motion explains how an object moves along a straight path. Students begin with familiar examples like walking to school, a taxi on a road, or a bicycle on a straight stretch.",
      concepts: [
        "Distance is the total path covered, while displacement is the straight-line change in position.",
        "Velocity describes both speed and direction of motion.",
        "Acceleration tells us how quickly velocity changes.",
      ],
      activities: [
        "Observe how displacement changes when initial velocity increases.",
        "Compare motion with positive and negative acceleration.",
        "Predict final velocity before checking the simulation output.",
      ],
    },
    simulation: {
      type: "kinematics",
      title: "Kinematics Sandbox",
      description:
        "Change the initial velocity, acceleration, and elapsed time to see how motion values respond.",
      formulaNote: "Uses s = ut + 1/2at² and v = u + at for constant acceleration.",
      controls: [
        {
          id: "initialVelocity",
          label: "Initial velocity",
          unit: "m/s",
          min: 0,
          max: 20,
          step: 1,
          defaultValue: 6,
        },
        {
          id: "acceleration",
          label: "Acceleration",
          unit: "m/s²",
          min: -5,
          max: 10,
          step: 1,
          defaultValue: 2,
        },
        {
          id: "time",
          label: "Time",
          unit: "s",
          min: 1,
          max: 10,
          step: 1,
          defaultValue: 4,
        },
      ],
    },
    quiz: {
      title: "Linear Motion Check",
      questions: [
        {
          id: 1,
          prompt: "A bicycle moves 20 m in 4 s. What is its speed?",
          options: ["4 m/s", "5 m/s", "6 m/s", "24 m/s"],
          answer: "5 m/s",
          explanation: "Speed is distance divided by time, so 20 / 4 = 5 m/s.",
        },
        {
          id: 2,
          prompt: "If acceleration is positive, what happens to velocity over time?",
          options: [
            "It must stay at zero",
            "It decreases only",
            "It changes in the positive direction",
            "It becomes distance",
          ],
          answer: "It changes in the positive direction",
          explanation: "Acceleration measures the change in velocity each second.",
        },
      ],
    },
  },
  {
    id: "forces-and-acceleration",
    title: "Forces and Acceleration",
    slug: "forces-and-acceleration",
    level: "Senior 2",
    duration: "15 min",
    category: "Mechanics",
    summary: "Explore how changing force or mass affects acceleration in Newton's second law.",
    objectives: [
      "Explain balanced and unbalanced forces",
      "Use F = ma to calculate acceleration",
      "Compare the effect of changing mass versus changing force",
    ],
    lesson: {
      overview:
        "Newton's second law links force, mass, and acceleration. When a larger force acts on the same mass, acceleration increases. For the same force, increasing mass reduces acceleration.",
      concepts: [
        "Resultant force is the overall force acting on an object.",
        "Acceleration increases with force when mass stays constant.",
        "Acceleration decreases with mass when force stays constant.",
      ],
      activities: [
        "Increase force and observe the acceleration response.",
        "Double the mass and compare the new acceleration.",
        "Discuss examples like pushing a wheelbarrow or starting a motorcycle.",
      ],
    },
    simulation: {
      type: "newton-second-law",
      title: "Force and Mass Lab",
      description: "Adjust force and mass to see how acceleration changes.",
      formulaNote:
        "Uses a = F / m and estimates velocity change with v = at over the chosen time.",
      controls: [
        {
          id: "force",
          label: "Force",
          unit: "N",
          min: 1,
          max: 100,
          step: 1,
          defaultValue: 24,
        },
        {
          id: "mass",
          label: "Mass",
          unit: "kg",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 6,
        },
        {
          id: "time",
          label: "Time",
          unit: "s",
          min: 1,
          max: 10,
          step: 1,
          defaultValue: 3,
        },
      ],
    },
    quiz: {
      title: "Forces Check",
      questions: [
        {
          id: 1,
          prompt: "What happens to acceleration if force doubles and mass stays the same?",
          options: [
            "Acceleration halves",
            "Acceleration doubles",
            "Acceleration stays the same",
            "Acceleration becomes zero",
          ],
          answer: "Acceleration doubles",
          explanation: "From F = ma, acceleration is directly proportional to force.",
        },
        {
          id: 2,
          prompt: "A 12 N force acts on a 3 kg object. What is the acceleration?",
          options: ["2 m/s²", "3 m/s²", "4 m/s²", "9 m/s²"],
          answer: "4 m/s²",
          explanation: "Acceleration is force divided by mass, so 12 / 3 = 4 m/s².",
        },
      ],
    },
  },
  {
    id: "work-energy-power",
    title: "Work, Energy, and Power",
    slug: "work-energy-power",
    level: "Senior 3",
    duration: "14 min",
    category: "Energy",
    summary: "Calculate work, kinetic energy, and power from motion and force values.",
    objectives: [
      "Calculate work done from force and distance",
      "Relate kinetic energy to mass and velocity",
      "Explain power as the rate of doing work",
    ],
    lesson: {
      overview:
        "Work, energy, and power help explain how effort changes systems. Students connect formulas to lifting loads, moving carts, and operating machines.",
      concepts: [
        "Work done depends on force and displacement.",
        "Kinetic energy increases rapidly as velocity increases.",
        "Power tells us how quickly work is done.",
      ],
      activities: [
        "Change force and compare the work done.",
        "Increase velocity to see how kinetic energy changes.",
        "Discuss which machine does more work in less time.",
      ],
    },
    simulation: {
      type: "work-energy",
      title: "Energy Explorer",
      description:
        "Adjust force, distance, mass, velocity, and time to compare work, energy, and power.",
      formulaNote: "Uses W = Fd, KE = 1/2mv², and P = W/t.",
      controls: [
        {
          id: "force",
          label: "Force",
          unit: "N",
          min: 1,
          max: 100,
          step: 1,
          defaultValue: 20,
        },
        {
          id: "distance",
          label: "Distance",
          unit: "m",
          min: 1,
          max: 50,
          step: 1,
          defaultValue: 8,
        },
        {
          id: "mass",
          label: "Mass",
          unit: "kg",
          min: 1,
          max: 30,
          step: 1,
          defaultValue: 5,
        },
        {
          id: "velocity",
          label: "Velocity",
          unit: "m/s",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 6,
        },
        {
          id: "time",
          label: "Time",
          unit: "s",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 4,
        },
      ],
    },
    quiz: {
      title: "Energy Check",
      questions: [
        {
          id: 1,
          prompt: "If a 10 N force moves an object 6 m, what work is done?",
          options: ["16 J", "40 J", "60 J", "600 J"],
          answer: "60 J",
          explanation: "Work done equals force multiplied by distance.",
        },
        {
          id: 2,
          prompt: "Which quantity tells us how fast work is done?",
          options: ["Velocity", "Acceleration", "Power", "Mass"],
          answer: "Power",
          explanation: "Power is the rate of doing work.",
        },
      ],
    },
  },
  {
    id: "pressure-in-liquids",
    title: "Pressure in Liquids",
    slug: "pressure-in-liquids",
    level: "Senior 2",
    duration: "13 min",
    category: "Fluids",
    summary: "Explore how pressure changes with depth and liquid density in a simple fluid column.",
    objectives: [
      "State the relationship between pressure, depth, and density",
      "Apply p = rho g h in fluid pressure questions",
      "Relate fluid pressure to real life examples like dams and water tanks",
    ],
    lesson: {
      overview:
        "Liquid pressure increases with depth because deeper layers support more liquid above them. Students connect the formula to water storage tanks, boreholes, and fish habitats.",
      concepts: [
        "Pressure depends on density, gravitational field strength, and depth.",
        "The same depth in the same liquid gives equal pressure in every direction.",
        "Dense liquids create more pressure than less dense liquids at the same depth.",
      ],
      activities: [
        "Increase depth while keeping density fixed and compare the pressure rise.",
        "Compare pressure in water and oil at the same depth.",
        "Discuss why dams are thicker at the bottom.",
      ],
    },
    simulation: {
      type: "pressure",
      title: "Fluid Pressure Tank",
      description: "Change density, depth, and gravity to see how pressure in a liquid changes.",
      formulaNote: "Uses p = rho g h.",
      controls: [
        {
          id: "density",
          label: "Density",
          unit: "kg/m³",
          min: 500,
          max: 1500,
          step: 50,
          defaultValue: 1000,
        },
        {
          id: "gravity",
          label: "Gravity",
          unit: "m/s²",
          min: 8,
          max: 12,
          step: 0.5,
          defaultValue: 10,
        },
        {
          id: "depth",
          label: "Depth",
          unit: "m",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 5,
        },
      ],
    },
    quiz: {
      title: "Liquid Pressure Check",
      questions: [
        {
          id: 1,
          prompt: "What happens to liquid pressure as depth increases?",
          options: ["It decreases", "It remains constant", "It increases", "It becomes zero"],
          answer: "It increases",
          explanation: "More liquid above a point means greater pressure.",
        },
        {
          id: 2,
          prompt: "Which formula is used for pressure in liquids?",
          options: ["F = ma", "p = rho g h", "V = IR", "P = W/t"],
          answer: "p = rho g h",
          explanation: "Pressure in a liquid depends on density, gravity, and depth.",
        },
      ],
    },
  },
  {
    id: "electric-circuits",
    title: "Simple Electric Circuits",
    slug: "electric-circuits",
    level: "Senior 2",
    duration: "16 min",
    category: "Electricity",
    summary:
      "Investigate current, resistance, and voltage in a direct current circuit using Ohm's law.",
    objectives: [
      "Relate voltage, current, and resistance",
      "Use Ohm's law to solve simple circuit problems",
      "Describe how resistance affects current flow",
    ],
    lesson: {
      overview:
        "Simple circuits help learners explain how electrical energy moves through wires and components. The lesson connects batteries, bulbs, and resistors to the current learners see in everyday devices.",
      concepts: [
        "Voltage provides the push that drives charge through a circuit.",
        "Current reduces when resistance increases for the same voltage.",
        "Ohm's law is written as V = IR.",
      ],
      activities: [
        "Keep voltage constant and increase resistance to see current drop.",
        "Increase voltage with the same resistor and compare the current.",
        "Discuss why thin wires heat more easily than thick wires.",
      ],
    },
    simulation: {
      type: "circuits",
      title: "Ohm's Law Bench",
      description:
        "Adjust voltage and resistance to estimate current and electrical power in a circuit.",
      formulaNote: "Uses I = V / R and P = VI.",
      controls: [
        {
          id: "voltage",
          label: "Voltage",
          unit: "V",
          min: 1,
          max: 24,
          step: 1,
          defaultValue: 12,
        },
        {
          id: "resistance",
          label: "Resistance",
          unit: "ohms",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 6,
        },
      ],
    },
    quiz: {
      title: "Circuit Check",
      questions: [
        {
          id: 1,
          prompt: "If voltage is 12 V and resistance is 4 ohms, what is the current?",
          options: ["2 A", "3 A", "4 A", "48 A"],
          answer: "3 A",
          explanation: "From I = V / R, the current is 12 / 4 = 3 A.",
        },
        {
          id: 2,
          prompt: "What happens to current when resistance increases at constant voltage?",
          options: ["It increases", "It decreases", "It stays the same", "It becomes power"],
          answer: "It decreases",
          explanation: "Current is inversely proportional to resistance in Ohm's law.",
        },
      ],
    },
  },
  {
    id: "waves-and-frequency",
    title: "Waves and Frequency",
    slug: "waves-and-frequency",
    level: "Senior 1",
    duration: "11 min",
    category: "Waves",
    summary: "Use wave speed, wavelength, and frequency to understand how waves transfer energy.",
    objectives: [
      "Define wavelength, frequency, and wave speed",
      "Use v = f lambda in wave calculations",
      "Compare the effect of changing frequency or wavelength",
    ],
    lesson: {
      overview:
        "Waves carry energy from one place to another without permanently transporting matter. This lesson uses rope waves, sound, and water ripples to show the link between frequency and wavelength.",
      concepts: [
        "Frequency is the number of complete waves passing a point each second.",
        "Wavelength is the distance between corresponding points on successive waves.",
        "Wave speed depends on frequency and wavelength.",
      ],
      activities: [
        "Increase frequency while keeping wave speed fixed and observe the wavelength drop.",
        "Compare long and short wavelength wave patterns.",
        "Relate sound pitch to frequency.",
      ],
    },
    simulation: {
      type: "waves",
      title: "Wave Relationship Lab",
      description: "Adjust frequency and wavelength to compare wave speed and period.",
      formulaNote: "Uses v = f lambda and T = 1 / f.",
      controls: [
        {
          id: "frequency",
          label: "Frequency",
          unit: "Hz",
          min: 1,
          max: 20,
          step: 1,
          defaultValue: 5,
        },
        {
          id: "wavelength",
          label: "Wavelength",
          unit: "m",
          min: 1,
          max: 12,
          step: 1,
          defaultValue: 4,
        },
      ],
    },
    quiz: {
      title: "Wave Check",
      questions: [
        {
          id: 1,
          prompt: "What is the unit of frequency?",
          options: ["Metre", "Second", "Hertz", "Joule"],
          answer: "Hertz",
          explanation: "Frequency is measured in hertz, abbreviated as Hz.",
        },
        {
          id: 2,
          prompt: "A wave has frequency 5 Hz and wavelength 4 m. What is its speed?",
          options: ["1.25 m/s", "9 m/s", "20 m/s", "40 m/s"],
          answer: "20 m/s",
          explanation: "Wave speed is frequency multiplied by wavelength.",
        },
      ],
    },
  },
];

const users = [
  {
    id: "admin-harry",
    name: "Harry Admin",
    username: "admin",
    password: "admin123",
    role: "admin",
    classLevel: "Staff",
  },
  {
    id: "student-aisha",
    name: "Aisha Namutebi",
    username: "aisha",
    password: "student123",
    role: "student",
    classLevel: "Senior 1",
  },
  {
    id: "student-brian",
    name: "Brian Okello",
    username: "brian",
    password: "student123",
    role: "student",
    classLevel: "Senior 2",
  },
  {
    id: "student-claire",
    name: "Claire Achan",
    username: "claire",
    password: "student123",
    role: "student",
    classLevel: "Senior 3",
  },
];

module.exports = {
  topics,
  users,
};
