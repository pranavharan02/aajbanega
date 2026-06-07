import { AuthProvider } from '@/components/AuthProvider'
import { Nav } from '@/components/Nav'
import { ToastContainer } from '@/components/Toast'
import { ServiceWorkerRegistration } from '@/components/ServiceWorker'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="mx-auto max-w-[680px] px-5 pb-24">
        <Nav />
        {children}
      </div>
      <ToastContainer />
      <ServiceWorkerRegistration />
    </AuthProvider>
  )
}
