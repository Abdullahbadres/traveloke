"use client"

import { createContext, useState, useEffect, useContext } from "react"

const WishlistContext = createContext()

export const useWishlist = () => useContext(WishlistContext)

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    const storedWishlist = localStorage.getItem("wishlist")
    if (storedWishlist) {
      setWishlist(JSON.parse(storedWishlist))
    }
  }, [])

  const addToWishlist = (activity) => {
    const updatedWishlist = [...wishlist]
    const existingIndex = updatedWishlist.findIndex((item) => item.id === activity.id)

    if (existingIndex === -1) {
      updatedWishlist.push(activity)
      setWishlist(updatedWishlist)
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
      return true
    }
    return false
  }

  const removeFromWishlist = (activityId) => {
    const updatedWishlist = wishlist.filter((item) => item.id !== activityId)
    setWishlist(updatedWishlist)
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
  }

  const isInWishlist = (activityId) => {
    return wishlist.some((item) => item.id === activityId)
  }

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}
