import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx'
import SurfacesIndexPage from './pages/SurfacesIndexPage.jsx'
import SurfacePage from './pages/SurfacePage.jsx'
import FeatureDetailPage from './pages/FeatureDetailPage.jsx'
import SpatialPage from './pages/SpatialPage.jsx'
import ModulesPage from './pages/ModulesPage.jsx'
import GeneSearchPage from './pages/GeneSearchPage.jsx'
import CellTypeBrowsePage from './pages/CellTypeBrowsePage.jsx'
import NicheBrowsePage from './pages/NicheBrowsePage.jsx'
import TourPage from './pages/TourPage.jsx'
import StoriesPage from './pages/StoriesPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import CausalAuditPage from './pages/CausalAuditPage.jsx'
import './index.css'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tour', element: <TourPage /> },
      { path: 'stories', element: <StoriesPage /> },
      { path: 'surfaces', element: <SurfacesIndexPage /> },
      { path: 'surface/:name', element: <SurfacePage /> },
      { path: 'surface/:name/feature/:idx', element: <FeatureDetailPage /> },
      { path: 'surface/:name/feature/:idx/spatial', element: <SpatialPage /> },
      { path: 'surface/:name/modules', element: <ModulesPage /> },
      { path: 'genes', element: <GeneSearchPage /> },
      { path: 'genes/:symbol', element: <GeneSearchPage /> },
      { path: 'celltypes', element: <CellTypeBrowsePage /> },
      { path: 'celltypes/:term', element: <CellTypeBrowsePage /> },
      { path: 'niches', element: <NicheBrowsePage /> },
      { path: 'niches/:level/:niche', element: <NicheBrowsePage /> },
      { path: 'causal', element: <CausalAuditPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
