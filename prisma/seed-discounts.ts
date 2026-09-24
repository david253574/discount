import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const firstNames = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", 
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", 
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", 
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", 
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", 
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", 
  "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", 
  "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", 
  "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna", 
  "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", 
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", 
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", 
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", 
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", 
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", 
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", 
  "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", 
  "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", 
  "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson"
];

function getRandomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`.toLowerCase();
}

async function main() {
  console.log('Generating names...');
  const namesToInsert = new Set<string>();
  
  // Generate 250 unique random names
  while(namesToInsert.size < 250) {
    namesToInsert.add(getRandomName());
  }

  const namesArray = Array.from(namesToInsert).map(name => ({ name }));

  console.log(`Inserting ${namesArray.length} names into DiscountEligibility...`);
  
  // Insert using a loop to avoid unique constraint errors and SQLite's lack of skipDuplicates
  let count = 0;
  for (const nameObj of namesArray) {
    try {
      await prisma.discountEligibility.upsert({
        where: { name: nameObj.name },
        update: {},
        create: { name: nameObj.name }
      });
      count++;
    } catch (e) {
      // ignore
    }
  }

  console.log(`Successfully added ${count} eligible users.`);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
