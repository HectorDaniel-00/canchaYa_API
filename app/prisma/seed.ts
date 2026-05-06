import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  BookingStatus,
  PaymentStatus,
  PlanType,
  PrismaClient,
  Role,
  SubscriptionStatus,
  SurfaceType,
} from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  /**
   * ? USERS
   */
  const password = await bcrypt.hash('123456', 10);

  const [admin, owner, player] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@test.com',
        phone: '1111111111',
        password,
        role: Role.ADMIN,
      },
    }),

    prisma.user.upsert({
      where: { email: 'owner@test.com' },
      update: {},
      create: {
        name: 'Owner',
        email: 'owner@test.com',
        phone: '2222222222',
        password,
        role: Role.OWNER,
      },
    }),

    prisma.user.upsert({
      where: { email: 'player@test.com' },
      update: {},
      create: {
        name: 'Player',
        email: 'player@test.com',
        phone: '3333333333',
        password,
        role: Role.PLAYER,
      },
    }),
  ]);

  /**
   * ? COURTS (5 courts)
   */
  const courts = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.court.create({
        data: {
          name: `Cancha ${i + 1}`,
          description: `Cancha deportiva ${i + 1} con excelentes instalaciones`,
          price: 40000 + i * 10000,
          location: ['Medellín', 'Bogotá', 'Cali', 'Barranquilla', 'Cartagena'][
            i
          ],
          lat: 6.2442 + i * 0.05,
          lng: -75.5812 - i * 0.05,
          surface: [
            SurfaceType.SYNTHETIC,
            SurfaceType.NATURAL,
            SurfaceType.FUTSAL,
            SurfaceType.SYNTHETIC,
            SurfaceType.NATURAL,
          ][i],
          ownerId: owner.id,
        },
      }),
    ),
  );

  /**
   * ? TIMESLOTS (5 slots)
   */
  const timeSlots = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.timeSlot.create({
        data: {
          startTime: new Date(`2026-05-0${i + 1}T${10 + i}:00:00`),
          endTime: new Date(`2026-05-0${i + 1}T${11 + i}:00:00`),
          courtId: courts[i % courts.length].id,
        },
      }),
    ),
  );

  /**
   * ? BOOKINGS (5 bookings)
   */
  const bookings = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.booking.create({
        data: {
          date: new Date(`2026-05-0${i + 1}`),
          total: courts[i].price,
          status: [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CANCELLED,
            BookingStatus.CONFIRMED,
          ][i],
          userId: player.id,
          courtId: courts[i].id,
          timeSlotId: timeSlots[i].id,
        },
      }),
    ),
  );

  /**
   * ? PAYMENTS (5 payments)
   */
  await Promise.all(
    bookings.map((b, i) =>
      prisma.payment.create({
        data: {
          amount: b.total,
          status: [
            PaymentStatus.PAID,
            PaymentStatus.PENDING,
            PaymentStatus.PAID,
            PaymentStatus.REFUNDED,
            PaymentStatus.PAID,
          ][i],
          stripeId: `fake_stripe_${i + 1}`,
          bookingId: b.id,
        },
      }),
    ),
  );

  /**
   * ? REVIEWS (5 reviews)
   */
  await Promise.all(
    courts.map((c, i) =>
      prisma.review.create({
        data: {
          rating: 3 + (i % 3),
          comment: `Muy buena experiencia en ${c.name}`,
          userId: player.id,
          courtId: c.id,
        },
      }),
    ),
  );

  /**
   * ? SUBSCRIPTIONS (5 subscriptions)
   */
  const users = [admin, owner, player];

  await Promise.all(
    users.map((user, i) =>
      prisma.subscription.upsert({
        where: { userId: user.id },
        update: {}, // no cambias nada si ya existe
        create: {
          plan: [PlanType.BASIC, PlanType.PRO, PlanType.PREMIUM][i],
          status: SubscriptionStatus.ACTIVE,
          userId: user.id,
        },
      }),
    ),
  );

  /**
   * ? NOTIFICATIONS (5 notifications)
   */
  await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.notification.create({
        data: {
          title: [
            'Reserva confirmada',
            'Pago recibido',
            'Nueva reseña',
            'Suscripción activa',
            'Recordatorio de partido',
          ][i],
          message: [
            'Tu reserva fue exitosa',
            'Hemos recibido tu pago',
            'Alguien dejó una reseña',
            'Tu suscripción está activa',
            'Tienes un partido mañana',
          ][i],
          read: i % 2 === 0,
          userId: users[i % users.length].id,
        },
      }),
    ),
  );

  console.log(' Seed completo ejecutado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
