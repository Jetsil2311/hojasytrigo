import { useEffect, useState } from 'react'
import { db, collection, onSnapshot, query, where } from '../demo/store'

// Live active promotion (only one is active at a time).
export const usePromotion = () => {
  const [promotion, setPromotion] = useState(null)

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'promotions'), where('isActive', '==', true)),
      (snapshot) => {
        const active = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))[0]
        setPromotion(active ?? null)
      },
      () => setPromotion(null)
    )
  }, [])

  return { promotion }
}
