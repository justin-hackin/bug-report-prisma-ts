
import { PrismaClient, Prisma } from '@prisma/client'
export const SAMPLE_USER_NAME = 'Ziggy Ziggler';

const prisma = new PrismaClient()

// A `main` function so that we can use async/await
async function main() {
  const calendarCreateInputs: Prisma.CalendarCreateInput[] = [
    {
      name: 'Test Orange',
      icsUrl: "[REDACTED]"
    }, {
      name: 'Test Apple',
      icsUrl: "[REDACTED]"
    }
  ];

  const groupsCreateInputs: Prisma.GroupCreateInput[] = [
    {
      name: 'All great things',
      calendars: {
        create: calendarCreateInputs
      }
    }
  ]
  const regionName = 'default';
  const regionData: Prisma.RegionCreateInput = {
    name: regionName,
    groups: { create: groupsCreateInputs },
  };

  const region = await prisma.region.create({
    data: regionData
  });

  const userCreateInput: Prisma.UserCreateInput = {
    name: SAMPLE_USER_NAME,
    region: {
      // why does the region does not have an id property on the type
      connect: {id: region.id }
    },
  };

  const getUser = () => prisma.user.findFirst({
    where: {
      name: SAMPLE_USER_NAME
    },
    include: {
      region: {
        include: {
          groups: {
            include: {
              calendars: true,
            }
          },
        }
      },
    }
  })

  const user = await prisma.user.create({data: userCreateInput })

  const queriedUser = await getUser();

  // PROBLEM: the type for queriedUser does not contain the nested relations even though they exist on the instance at runtime

  // Below causes a compile error if ts check is not ignored for line
  // @ts-ignore
  const groups = queriedUser.region.groups;
  console.log('GROUPS: ', groups);
  console.log('FIRST GROUP CALENDARS: ', groups[0].calendars);

  const coercedUser = queriedUser as Prisma.PromiseReturnType<typeof getUser>;

  // though this is a TS error, it doesn't break the compilation like the previous one
  const coercedGroups = coercedUser?.region.groups;
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
