
import Bike from '../models/Bike.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total bikes count
    const totalBikes = await Bike.countDocuments();
    
    // Get in-stock bikes count
    const inStock = await Bike.countDocuments({ 
      status: 'IN_STOCK' 
    });
    
    // Get bikes with low stock (less than 5)
    const lowStock = await Bike.countDocuments({
      stock: { $lt: 5 },
      status: 'IN_STOCK'
    });
    
    // Get total customers count
    const totalCustomers = await Customer.countDocuments();
    
    // Get today's sales
    const todaySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: today, $lt: tomorrow },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          bikesSold: { $sum: '$quantity' }
        }
      }
    ]);
    
    // Get recent sales for activities
    const recentSales = await Sale.find({ 
      status: 'ACTIVE' 
    })
      .populate('bikeId', 'model')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent bikes added
    const recentBikes = await Bike.find()
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Get recent customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(3);

    // Format recent activities
    const recentActivities = [
      // Add recent sales
      ...recentSales.map(sale => ({
        type: 'sale',
        message: `${sale.bikeId?.model || 'Bike'} sold to ${sale.customerId?.name || 'Customer'}`,
        time: getTimeAgo(sale.createdAt)
      })),
      
      // Add recent bike stock
      ...recentBikes.map(bike => ({
        type: 'stock',
        message: `Added ${bike.stock} units of ${bike.model}`,
        time: getTimeAgo(bike.createdAt)
      })),
      
      // Add recent customers
      ...recentCustomers.map(customer => ({
        type: 'customer',
        message: `New customer registered: ${customer.name}`,
        time: getTimeAgo(customer.createdAt)
      })),
      
      // Add low stock alerts
      ...(lowStock > 0 ? [{
        type: 'alert',
        message: `Low stock alert: ${lowStock} bike${lowStock > 1 ? 's' : ''} need restocking`,
        time: 'Just now'
      }] : [])
    ].slice(0, 4); // Get only 4 most recent activities

    // Get weekly sales trend
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: weekAgo },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } 
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get payment method distribution
    const paymentMethods = await Sale.aggregate([
      {
        $match: {
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBikes,
          inStock,
          soldToday: todaySales[0]?.count || 0,
          revenueToday: todaySales[0]?.revenue || 0,
          bikesSoldToday: todaySales[0]?.bikesSold || 0,
          lowStock,
          totalCustomers,
          weeklySales,
          paymentMethods
        },
        recentActivities
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get sales overview for charts
export const getSalesOverview = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch(period) {
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const salesData = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'yearly' ? "%Y-%m" : "%Y-%m-%d", 
              date: "$saleDate" 
            }
          },
          salesCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          bikesSold: { $sum: '$quantity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: salesData
    });
    
  } catch (error) {
    console.error('Sales overview error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get top selling bikes
export const getTopSellingBikes = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const topBikes = await Sale.aggregate([
      {
        $match: { status: 'ACTIVE' }
      },
      {
        $lookup: {
          from: 'bikes',
          localField: 'bikeId',
          foreignField: '_id',
          as: 'bikeDetails'
        }
      },
      { $unwind: '$bikeDetails' },
      {
        $group: {
          _id: '$bikeId',
          bikeModel: { $first: '$bikeDetails.model' },
          bikeColor: { $first: '$bikeDetails.color' },
          totalSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' },
          averagePrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.status(200).json({
      success: true,
      data: topBikes
    });
    
  } catch (error) {
    console.error('Top bikes error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get revenue statistics
export const getRevenueStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Today's revenue
    const todayRevenue = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: today },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Yesterday's revenue
    const yesterdayRevenue = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: yesterday, $lt: today },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // This month's revenue
    const thisMonthRevenue = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: thisMonth, $lt: nextMonth },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Last month's revenue
    const lastMonthRevenue = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: lastMonth, $lt: thisMonth },
          status: 'ACTIVE'
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Calculate growth percentages
    const yesterdayRev = yesterdayRevenue[0]?.revenue || 0;
    const todayRev = todayRevenue[0]?.revenue || 0;
    const dailyGrowth = yesterdayRev > 0 ? 
      ((todayRev - yesterdayRev) / yesterdayRev * 100).toFixed(1) : 0;
    
    const lastMonthRev = lastMonthRevenue[0]?.revenue || 0;
    const thisMonthRev = thisMonthRevenue[0]?.revenue || 0;
    const monthlyGrowth = lastMonthRev > 0 ? 
      ((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        today: todayRev,
        yesterday: yesterdayRev,
        thisMonth: thisMonthRev,
        lastMonth: lastMonthRev,
        dailyGrowth: parseFloat(dailyGrowth),
        monthlyGrowth: parseFloat(monthlyGrowth)
      }
    });
    
  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to get time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
};