import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AdminPage } from './pages/AdminPage'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { AdminRoute } from './components/common/AdminRoute'
import { AdminPostsPage } from './pages/AdminPostsPage'
import { AdminPostEditPage } from './pages/AdminPostEditPage'
import { PostDetail } from './components/posts'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/posts/:id" element={<PostDetail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
          <Route path="/admin/posts/new" element={<AdminPostEditPage />} />
          <Route path="/admin/posts/:id/edit" element={<AdminPostEditPage />} />
        </Route>
      </Route>
    </Routes>
  )
}


