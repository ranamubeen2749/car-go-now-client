import React from 'react'
import NavbarOwner from '../../components/owner/NavbarOwner'
import Sidebar from '../../components/owner/Sidebar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <NavbarOwner />
      <div className="flex flex-1 min-h-0">
        <aside className="shrink-0 h-full overflow-hidden">
          <Sidebar />
        </aside>
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
