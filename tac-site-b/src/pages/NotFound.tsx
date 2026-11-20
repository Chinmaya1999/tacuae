import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  useSeo('Page not found', 'The page you are looking for could not be found.', '/404')
  return (
    <section className="relative grid min-h-[80vh] place-items-center overflow-hidden px-4 text-center">
      <div className="bp-grid absolute inset-0" />
      <div className="relative">
        <p className="eyebrow">Error 404</p>
        <h1 className="h-display mt-4">Signal lost.</h1>
        <p className="lead mx-auto mt-5 max-w-md">This page isn’t part of the network. Let’s get you back to something that is.</p>
        <Link to="/" className="btn btn-primary mt-10">Back to home <ArrowRight size={16} /></Link>
      </div>
    </section>
  )
}
