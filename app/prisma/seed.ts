import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { BookingStatus, PaymentStatus, PlanType, PrismaClient, Role, SubscriptionStatus, SurfaceType } from '../src/generated/prisma/client'

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
})

async function main() {
    /**
     * ? USERS
    */
    const password = await bcrypt.hash('123456', 10)

    const [admin, owner, player] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: {},
            create: {
                name: 'Admin',
                email: 'admin@test.com',
                phone: '1111111111',
                password,
                role: Role.ADMIN
            }
        }),

        prisma.user.upsert({
            where: { email: 'owner@test.com' },
            update: {},
            create: {
                name: 'Owner',
                email: 'owner@test.com',
                phone: '2222222222',
                password,
                role: Role.OWNER
            }
        }),

        prisma.user.upsert({
            where: { email: 'player@test.com' },
            update: {},
            create: {
                name: 'Player',
                email: 'player@test.com',
                phone: '3333333333',
                password,
                role: Role.PLAYER
            }
        })
    ])

    /**
     * ? COURTS
    */
    const court = await prisma.court.create({
        data: {
            name: 'Cancha Sintética Medellín',
            description: 'Cancha top',
            price: 50000,
            location: 'Medellín',
            lat: 6.2442,
            lng: -75.5812,
            surface: SurfaceType.SYNTHETIC,
            ownerId: owner.id
        }
    })

    /**
     * ? TIMESLOTS
    */
    const timeSlots = await Promise.all([
        prisma.timeSlot.create({
            data: {
                startTime: new Date('2026-05-01T10:00:00'),
                endTime: new Date('2026-05-01T11:00:00'),
                courtId: court.id
            }
        }),
        prisma.timeSlot.create({
            data: {
                startTime: new Date('2026-05-01T11:00:00'),
                endTime: new Date('2026-05-01T12:00:00'),
                courtId: court.id
            }
        })
    ])

    /**
     * ? BOOKING
    */
    const booking = await prisma.booking.create({
        data: {
            date: new Date(),
            total: 50000,
            status: BookingStatus.CONFIRMED,
            userId: player.id,
            courtId: court.id,
            timeSlotId: timeSlots[0].id
        }
    })

    /**
     * ? PAYMENTS
    */
    await prisma.payment.create({
        data: {
            amount: 50000,
            status: PaymentStatus.PAID,
            stripeId: 'fake_stripe_123',
            bookingId: booking.id
        }
    })

    /**
     * ? REVIEWS
    */
    await prisma.review.create({
        data: {
            rating: 5,
            comment: 'Excelente cancha',
            userId: player.id,
            courtId: court.id
        }
    })


    /**
     * ? SUBSCRIPTION
    */
    await prisma.subscription.create({
        data: {
            plan: PlanType.PRO,
            status: SubscriptionStatus.ACTIVE,
            userId: owner.id
        }
    })

    /**
     * ? NOTIFICATION
    */
    await prisma.notification.create({
        data: {
            title: 'Reserva confirmada',
            message: 'Tu reserva fue exitosa',
            userId: player.id
        }
    })

    console.log(' Seed completo ejecutado')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())