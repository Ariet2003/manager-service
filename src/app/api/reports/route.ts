import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/reports/sales
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    switch (type) {
      case 'sales': {
        console.log('Fetching sales report for period:', { startDate, endDate });

        // Получаем все оплаченные заказы за период
        const orders = await prisma.order.findMany({
          where: {
            status: 'PAID',
            paidAt: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            },
          },
          select: {
            id: true,
            tableNumber: true,
            status: true,
            totalPrice: true,
            paidAt: true,
            waiter: {
              select: {
                id: true,
                fullName: true,
              },
            },
            cashier: {
              select: {
                id: true,
                fullName: true,
              },
            },
            items: {
              select: {
                quantity: true,
                price: true,
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                paymentType: true,
                paidAt: true,
              },
            },
          },
          orderBy: {
            paidAt: 'desc',
          },
        });

        console.log(`Found ${orders.length} orders`);

        // Подсчет общей статистики
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
        const averageCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Группировка по способам оплаты
        const paymentsByType = orders.reduce((acc, order) => {
          order.payments.forEach(payment => {
            const type = payment.paymentType;
            acc[type] = (acc[type] || 0) + Number(payment.amount);
          });
          return acc;
        }, {} as Record<string, number>);

        // Группировка по официантам
        const waiterStats = orders.reduce((acc, order) => {
          const waiterId = order.waiter.id;
          if (!acc[waiterId]) {
            acc[waiterId] = {
              name: order.waiter.fullName,
              ordersCount: 0,
              totalRevenue: 0,
            };
          }
          acc[waiterId].ordersCount += 1;
          acc[waiterId].totalRevenue += Number(order.totalPrice);
          return acc;
        }, {} as Record<string, { name: string; ordersCount: number; totalRevenue: number }>);

        // Группировка по популярным блюдам
        const popularItems = orders.reduce((acc, order) => {
          order.items.forEach(item => {
            const menuItemId = item.menuItem.id;
            if (!acc[menuItemId]) {
              acc[menuItemId] = {
                name: item.menuItem.name,
                quantity: 0,
                revenue: 0,
              };
            }
            acc[menuItemId].quantity += item.quantity;
            acc[menuItemId].revenue += Number(item.price) * item.quantity;
          });
          return acc;
        }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

        // Форматируем данные для ответа
        const response = {
          orders: orders.map(order => ({
            id: order.id,
            tableNumber: order.tableNumber,
            paidAt: order.paidAt,
            totalPrice: order.totalPrice,
            waiterName: order.waiter.fullName,
            cashierName: order.cashier?.fullName,
            paymentTypes: order.payments.map(p => p.paymentType),
            items: order.items.map(item => ({
              name: item.menuItem.name,
              quantity: item.quantity,
              price: item.price,
            })),
          })),
          stats: {
            totalOrders,
            totalRevenue,
            averageCheck,
            paymentsByType,
            waiterStats: Object.values(waiterStats),
            popularItems: Object.values(popularItems)
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 10),
          },
        };

        console.log('Successfully prepared sales report');
        return NextResponse.json(response);
      }

      case 'inventory': {
        // Отчет по инвентаризации
        const ingredients = await prisma.ingredient.findMany({
          include: {
            deliveries: {
              where: {
                deliveryDate: {
                  gte: startDate ? new Date(startDate) : undefined,
                  lte: endDate ? new Date(endDate) : undefined,
                },
              },
            },
            writeOffs: {
              where: {
                date: {
                  gte: startDate ? new Date(startDate) : undefined,
                  lte: endDate ? new Date(endDate) : undefined,
                },
              },
            },
          },
        });

        return NextResponse.json({ ingredients });
      }

      case 'employees': {
        // Отчет по сотрудникам
        const shifts = await prisma.shift.findMany({
          where: {
            startedAt: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined,
            },
          },
          include: {
            manager: true,
            staff: {
              include: {
                user: true,
              },
            },
            orders: {
              where: {
                status: 'PAID',
              },
              select: {
                id: true,
                totalPrice: true,
                status: true,
                payments: {
                  select: {
                    amount: true,
                    paymentType: true
                  }
                }
              }
            },
          },
        });

        return NextResponse.json({ shifts });
      }

      case 'popular-items': {
        // Отчет по популярным блюдам
        const menuItems = await prisma.orderItem.groupBy({
          by: ['menuItemId'],
          where: {
            order: {
              status: 'PAID',
              paidAt: {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              },
            },
          },
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
        });

        const itemsWithDetails = await prisma.menuItem.findMany({
          where: {
            id: {
              in: menuItems.map(item => item.menuItemId),
            },
          },
        });

        return NextResponse.json({ 
          items: menuItems.map(item => ({
            ...item,
            details: itemsWithDetails.find(detail => detail.id === item.menuItemId),
          })),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Неизвестный тип отчета' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Ошибка при формировании отчета' },
      { status: 500 }
    );
  }
} 