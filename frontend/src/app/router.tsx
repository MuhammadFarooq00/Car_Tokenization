import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Discover } from '@/pages/Discover';
import { CarDetail } from '@/pages/CarDetail';
import { Marketplace } from '@/pages/Marketplace';
import { ListingDetail } from '@/pages/ListingDetail';
import { Portfolio } from '@/pages/Portfolio';
import { CreateCar } from '@/pages/CreateCar';
import { SellShares } from '@/pages/SellShares';
import { Admin } from '@/pages/Admin';
import { Login } from '@/pages/Auth/Login';
import { Signup } from '@/pages/Auth/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Profile } from '@/pages/Profile';
import { NotFound } from '@/pages/NotFound';
import { ErrorPage } from '@/pages/Error';
import { ProtectedRoute, GuestOnlyRoute } from '@/components/auth/ProtectedRoute';

// Admin pages
import { DriverApprovals } from '@/pages/Admin/DriverApprovals';
import { KYCManagement } from '@/pages/Admin/KYC';
import { AdminAnalytics } from '@/pages/Admin/Analytics';
import { UsersManagement } from '@/pages/Admin/Users';
import { TransactionsManagement } from '@/pages/Admin/Transactions';
import { ExpensesManagement } from '@/pages/Admin/Expenses';
import { CarsManagement } from '@/pages/Admin/Cars';
import { OnboardingManagement } from '@/pages/Admin/Onboarding';

// Driver pages
import { DriverApply } from '@/pages/Driver/Apply';
import { LogRide } from '@/pages/Driver/LogRide';
import { LogExpense } from '@/pages/Driver/LogExpense';
import { AllRides } from '@/pages/Driver/AllRides';
import { AllExpenses } from '@/pages/Driver/AllExpenses';

// Owner pages
import { CarMonitoring } from '@/pages/Owner/CarMonitoring';
import { DriverRequests } from '@/pages/Owner/DriverRequests';
import { MyApplications } from '@/pages/Driver/MyApplications';

// Investor pages
import { InvestorAnalytics } from '@/pages/Investor/Analytics';

// Public pages
import { Leaderboard } from '@/pages/Leaderboard';
// import { Earnings } from '@/pages/Earnings'; // disabled — page not ready
import { LikedCars } from '@/pages/LikedCars';
import { ForgotPassword } from '@/pages/Auth/ForgotPassword';
import { VerifyEmail } from '@/pages/Auth/VerifyEmail';
import { ResetPassword } from '@/pages/Auth/ResetPassword';

// Resource & Legal pages
import { FAQ } from '@/pages/Resources/FAQ';
import { Support } from '@/pages/Resources/Support';
import { Documentation } from '@/pages/Resources/Documentation';
import { PrivacyPolicy } from '@/pages/Legal/PrivacyPolicy';
import { TermsOfService } from '@/pages/Legal/TermsOfService';
import { CookiePolicy } from '@/pages/Legal/CookiePolicy';

export const router = createBrowserRouter([
  // Auth routes (no layout)
  {
    path: '/login',
    element: (
      <GuestOnlyRoute>
        <Login />
      </GuestOnlyRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestOnlyRoute>
        <Signup />
      </GuestOnlyRoute>
    ),
  },

  // Forgot password (no layout, guest-only)
  {
    path: '/forgot-password',
    element: (
      <GuestOnlyRoute>
        <ForgotPassword />
      </GuestOnlyRoute>
    ),
  },

  // Email verification (no layout, public — link arrives from email)
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },

  // Password reset via emailed link (no layout, public)
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },

  // Main routes with layout
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'discover',
        element: <Discover />,
      },
      {
        path: 'car/:carId',
        element: <CarDetail />,
      },
      {
        path: 'marketplace',
        element: <Marketplace />,
      },
      {
        path: 'listing/:listingId',
        element: <ListingDetail />,
      },
      {
        path: 'portfolio',
        element: <Portfolio />,
      },
      {
        path: 'leaderboard',
        element: <Leaderboard />,
      },
      {
        path: 'create',
        element: (
          <ProtectedRoute allowedRoles={['car_owner', 'admin']}>
            <CreateCar />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sell/:carId',
        element: (
          <ProtectedRoute>
            <SellShares />
          </ProtectedRoute>
        ),
      },

      // Dashboard
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // Profile
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },

      // Earnings — disabled, page not ready
      // {
      //   path: 'earnings',
      //   element: (
      //     <ProtectedRoute>
      //       <Earnings />
      //     </ProtectedRoute>
      //   ),
      // },

      // Liked / Favourites (public — no auth needed, data is local)
      {
        path: 'liked',
        element: <LikedCars />,
      },

      // Admin routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/driver-approvals',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <DriverApprovals />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/kyc',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <KYCManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/onboarding',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <OnboardingManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/analytics',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAnalytics />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/transactions',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <TransactionsManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/expenses',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <ExpensesManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/cars',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <CarsManagement />
          </ProtectedRoute>
        ),
      },

      // Driver routes
      {
        path: 'driver/apply',
        element: (
          <ProtectedRoute>
            <DriverApply />
          </ProtectedRoute>
        ),
      },
      {
        path: 'driver/log-ride',
        element: (
          <ProtectedRoute allowedRoles={['driver']}>
            <LogRide />
          </ProtectedRoute>
        ),
      },
      {
        path: 'driver/log-expense',
        element: (
          <ProtectedRoute allowedRoles={['driver']}>
            <LogExpense />
          </ProtectedRoute>
        ),
      },

      {
        path: 'driver/rides',
        element: (
          <ProtectedRoute allowedRoles={['driver']}>
            <AllRides />
          </ProtectedRoute>
        ),
      },
      {
        path: 'driver/expenses',
        element: (
          <ProtectedRoute allowedRoles={['driver']}>
            <AllExpenses />
          </ProtectedRoute>
        ),
      },

      // Driver application status
      {
        path: 'driver/my-applications',
        element: (
          <ProtectedRoute>
            <MyApplications />
          </ProtectedRoute>
        ),
      },

      // Owner routes
      {
        path: 'owner/driver-requests',
        element: (
          <ProtectedRoute allowedRoles={['car_owner', 'admin']}>
            <DriverRequests />
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/monitoring',
        element: (
          <ProtectedRoute allowedRoles={['car_owner', 'admin']}>
            <CarMonitoring />
          </ProtectedRoute>
        ),
      },
      {
        path: 'owner/monitoring/:carId',
        element: (
          <ProtectedRoute allowedRoles={['car_owner', 'admin']}>
            <CarMonitoring />
          </ProtectedRoute>
        ),
      },

      // Investor routes
      {
        path: 'investor/analytics',
        element: (
          <ProtectedRoute allowedRoles={['investor']}>
            <InvestorAnalytics />
          </ProtectedRoute>
        ),
      },

      // Resource pages
      {
        path: 'faq',
        element: <FAQ />,
      },
      {
        path: 'support',
        element: <Support />,
      },
      {
        path: 'docs',
        element: <Documentation />,
      },

      // Legal pages
      {
        path: 'privacy',
        element: <PrivacyPolicy />,
      },
      {
        path: 'terms',
        element: <TermsOfService />,
      },
      {
        path: 'cookies',
        element: <CookiePolicy />,
      },

      // 404
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
