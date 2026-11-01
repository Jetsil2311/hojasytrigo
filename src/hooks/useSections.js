import { useEffect, useState } from 'react'
import { db, collection, onSnapshot } from '../demo/store'

// Live list of visible menu sections, sorted by their `order` field.
export const useSections = () => {
  const [sections, setSections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    return onSnapshot(
      collection(db, 'sections'),
      (snapshot) => {
        const results = snapshot.docs
          .map((d) => ({ id: d.data()?.id ?? d.id, docId: d.id, ...d.data() }))
          .filter((s) => s.visible !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setSections(results)
        setError('')
        setIsLoading(false)
      },
      () => {
        setError('No pudimos cargar el menú. Recarga la página para intentarlo de nuevo.')
        setIsLoading(false)
      }
    )
  }, [])

  return { sections, isLoading, error }
}
