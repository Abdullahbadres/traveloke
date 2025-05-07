"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getTransactions, updateTransactionStatus } from "../api"
import toast from "react-hot-toast"
import { MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import Modal from "../components/admin/Modal"
import PlaceholderImage from "../components/PlaceholderImage"

const TransactionHistory = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [manualRefresh, setManualRefresh] = useState(0)
  const itemsPerPage = 6

  // Function to fetch transactions with real-time updates
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getTransactions()
      setTransactions(response.data.data)
      setLastRefreshed(new Date())
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("")
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data load and setup real-time refresh
  useEffect(() => {
    fetchTransactions()

    // Set up real-time refresh every 15 seconds for admin users
    // or every 30 seconds for regular users
    // const interval = setInterval(
    //   () => {
    //     fetchTransactions()
    //   },
    //   user?.role === "admin" ? 15000 : 30000,
    // ) // 15 or 30 seconds

    setRefreshInterval(interval)

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [fetchTransactions, user?.role, manualRefresh])

  const handleManualRefresh = () => {
    setManualRefresh((prev) => prev + 1)
    toast.success("Refreshing transactions...")
  }

  const handleOpenViewModal = (transaction) => {
    setCurrentTransaction(transaction)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentTransaction(null)
  }

  const handleOpenUpdateStatusModal = (transaction) => {
    setCurrentTransaction(transaction)
    setNewStatus(transaction.status)
    setIsUpdateStatusModalOpen(true)
  }

  const handleCloseUpdateStatusModal = () => {
    setIsUpdateStatusModalOpen(false)
    setCurrentTransaction(null)
  }

  const handleUpdateStatus = async () => {
    if (!currentTransaction) return

    try {
      setSubmitting(true)
      await updateTransactionStatus(currentTransaction.id, { status: newStatus })
      toast.success("Transaction status updated successfully")

      // Update local state for immediate UI update
      setTransactions(transactions.map((t) => (t.id === currentTransaction.id ? { ...t, status: newStatus } : t)))

      // Refresh to ensure we have the latest data
      fetchTransactions()
      handleCloseUpdateStatusModal()
    } catch (error) {
      console.error("Error updating transaction status:", error)
      toast.error("Failed to update transaction status")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter transactions based on search term and status
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.activity?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Show at most 5 page numbers

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(maxPagesToShow - 1, totalPages - 1)
        for (let i = 2; i <= endPage; i++) {
          pageNumbers.push(i)
        }
      }
      // Adjust if we're near the end
      else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - (maxPagesToShow - 2))
        for (let i = startPage; i <= totalPages - 1; i++) {
          pageNumbers.push(i)
        }
      }
      // We're in the middle
      else {
        // Add ellipsis if needed
        if (startPage > 2) {
          pageNumbers.push("...")
        }

        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i)
        }

        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
          pageNumbers.push("...")
        }
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Helper function to get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Check if a transaction has a new payment proof (for highlighting)
  const isNewPaymentProof = (transaction) => {
    if (!transaction.paymentProofUrl) return false

    // Consider a payment proof as "new" if it was uploaded in the last 24 hours
    const proofDate = new Date(transaction.updatedAt)
    const now = new Date()
    const hoursDiff = (now - proofDate) / (1000 * 60 * 60)

    return hoursDiff < 24
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-20 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
            <button
              onClick={handleManualRefresh}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              title="Refresh transactions"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by ID, activity or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Status filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {loading && transactions.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg h-24 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions found.</p>
                </div>
              ) : (
                <>
                  {/* Mobile view - cards */}
                  <div className="block md:hidden space-y-4">
                    {currentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
                          isNewPaymentProof(transaction) && user?.role === "admin" ? "ring-2 ring-blue-400" : ""
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(transaction.status)}`}
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 rounded-md overflow-hidden mr-3">
                              {transaction.activity?.imageUrls?.[0] ? (
                                <img
                                  src={transaction.activity.imageUrls[0] || "/placeholder.svg"}
                                  alt={transaction.activity.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none"
                                    e.target.nextSibling.style.display = "flex"
                                  }}
                                />
                              ) : (
                                <PlaceholderImage
                                  text={transaction.activity?.title?.charAt(0) || "T"}
                                  className="w-full h-full"
                                />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium line-clamp-1">
                                {transaction.activity?.title || "Unknown Activity"}
                              </h3>
                              <p className="text-sm text-gray-500">ID: {transaction.id.substring(0, 8)}...</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">${transaction.amount?.toLocaleString() || "0"}</span>
                            <button
                              onClick={() => handleOpenViewModal(transaction)}
                              className="px-3 py-1 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] text-sm"
                            >
                              View Details
                            </button>
                          </div>

                          {isNewPaymentProof(transaction) && user?.role === "admin" && (
                            <div className="mt-2 text-xs text-blue-600 font-medium">New payment proof uploaded</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop view - table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Transaction ID
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Activity
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Payment
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className={`hover:bg-gray-50 ${
                              isNewPaymentProof(transaction) && user?.role === "admin" ? "bg-blue-50" : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                                  {transaction.activity?.imageUrls?.[0] ? (
                                    <img
                                      src={transaction.activity.imageUrls[0] || "/placeholder.svg"}
                                      alt={transaction.activity.title}
                                      className="h-10 w-10 object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none"
                                        e.target.nextSibling.style.display = "flex"
                                      }}
                                    />
                                  ) : (
                                    <PlaceholderImage
                                      text={transaction.activity?.title?.charAt(0) || "T"}
                                      className="h-10 w-10"
                                    />
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {transaction.activity?.title || "Unknown Activity"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ${transaction.amount?.toLocaleString() || "0"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(transaction.status)}`}
                              >
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.paymentProofUrl ? (
                                <span className="text-green-600 font-medium flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    ></path>
                                  </svg>
                                  {isNewPaymentProof(transaction) && user?.role === "admin" ? "New proof" : "Uploaded"}
                                </span>
                              ) : (
                                <span className="text-red-500">Not uploaded</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleOpenViewModal(transaction)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                View
                              </button>
                              {user?.role === "admin" && (
                                <button
                                  onClick={() => handleOpenUpdateStatusModal(transaction)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Update Status
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(endIndex, filteredTransactions.length)}</span> of{" "}
                            <span className="font-medium">{filteredTransactions.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav
                            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                            aria-label="Pagination"
                          >
                            <button
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Previous</span>
                              <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>

                            {getPageNumbers().map((pageNum, index) =>
                              pageNum === "..." ? (
                                <span
                                  key={`ellipsis-${index}`}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              ) : (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                      ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              ),
                            )}

                            <button
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Next</span>
                              <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Transaction Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Transaction Details">
        {currentTransaction && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex justify-between items-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(currentTransaction.status)}`}
              >
                {currentTransaction.status.charAt(0).toUpperCase() + currentTransaction.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">{new Date(currentTransaction.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex items-center">
              <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                {currentTransaction.activity?.imageUrls?.[0] ? (
                  <img
                    src={currentTransaction.activity.imageUrls[0] || "/placeholder.svg"}
                    alt={currentTransaction.activity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlaceholderImage
                    text={currentTransaction.activity?.title?.charAt(0) || "T"}
                    className="w-full h-full"
                  />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentTransaction.activity?.title || "Unknown Activity"}
                </h3>
                <p className="text-sm text-gray-500">Transaction ID: {currentTransaction.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Amount</p>
                <p className="text-lg font-bold text-gray-900">${currentTransaction.amount?.toLocaleString() || "0"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Payment Method</p>
                <p className="text-sm text-gray-900">{currentTransaction.paymentMethod || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">User</p>
                <p className="text-sm text-gray-900">{currentTransaction.user?.name || "Unknown User"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">{currentTransaction.user?.email || "N/A"}</p>
              </div>
            </div>

            {currentTransaction.paymentProofUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700">Payment Proof</p>
                <div className="mt-2 border rounded-md overflow-hidden">
                  <img
                    src={currentTransaction.paymentProofUrl || "/placeholder.svg"}
                    alt="Payment Proof"
                    className="w-full h-auto max-h-48 object-contain"
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <a
                    href={currentTransaction.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              </div>
            )}

            {currentTransaction.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Notes</p>
                <p className="text-sm text-gray-500">{currentTransaction.notes}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs text-gray-500">
                Created: {new Date(currentTransaction.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(currentTransaction.updatedAt).toLocaleString()}
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseViewModal()
                    handleOpenUpdateStatusModal(currentTransaction)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={isUpdateStatusModalOpen} onClose={handleCloseUpdateStatusModal} title="Update Transaction Status">
        {currentTransaction && (
          <div>
            <p className="mb-4">
              Update the status for transaction:{" "}
              <span className="font-medium">{currentTransaction.id.substring(0, 8)}...</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseUpdateStatusModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={submitting}
                className="px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TransactionHistory
