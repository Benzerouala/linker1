"use client"

import { useState, useEffect } from "react"
import "../styles/Pagination.css"

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems,
  itemsPerPage,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5
}) => {
  const [visiblePages, setVisiblePages] = useState([])

  useEffect(() => {
    const calculateVisiblePages = () => {
      const pages = []
      const halfVisible = Math.floor(maxVisiblePages / 2)
      
      let startPage = Math.max(1, currentPage - halfVisible)
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      // Adjust start if we're near the end
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      setVisiblePages(pages)
    }

    calculateVisiblePages()
  }, [currentPage, totalPages, maxVisiblePages])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getStartItem = () => (currentPage - 1) * itemsPerPage + 1
  const getEndItem = () => Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <div className="pagination-info">
        {totalItems > 0 && (
          <span>
            Affichage de {getStartItem()} à {getEndItem()} sur {totalItems} éléments
          </span>
        )}
      </div>
      
      <div className="pagination-controls">
        {showFirstLast && (
          <button
            className="pagination-btn pagination-first"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="Première page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        )}
        
        {showPrevNext && (
          <button
            className="pagination-btn pagination-prev"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Page précédente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        )}

        <div className="pagination-numbers">
          {visiblePages[0] > 1 && (
            <>
              <button
                className="pagination-btn pagination-number"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {visiblePages[0] > 2 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}

          {visiblePages.map((pageNum) => (
            <button
              key={pageNum}
              className={`pagination-btn pagination-number ${
                pageNum === currentPage ? 'active' : ''
              }`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="pagination-ellipsis">...</span>
              )}
              <button
                className="pagination-btn pagination-number"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {showPrevNext && (
          <button
            className="pagination-btn pagination-next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Page suivante"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        )}

        {showFirstLast && (
          <button
            className="pagination-btn pagination-last"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Dernière page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 5l7 7-7 7M6 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default Pagination
