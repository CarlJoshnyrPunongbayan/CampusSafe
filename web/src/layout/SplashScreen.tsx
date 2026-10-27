import { Icon } from '../components/Icon'
import { Spinner } from '../components/ui'

/** Same as the app's SplashScreen, shown while the session loads. */
export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <span className="rounded-[28px] bg-white/12 p-6">
        <Icon name="shield" size={68} className="text-white" />
      </span>
      <p className="mt-7 text-[34px] font-extrabold text-white">CampusSafe</p>
      <p className="mt-2.5 text-splash-text">Stay Alert. Stay Safe. Stay Connected.</p>
      <div className="mt-10">
        <Spinner inline light />
      </div>
    </div>
  )
}
