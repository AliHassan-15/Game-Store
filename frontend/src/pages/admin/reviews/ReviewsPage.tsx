import React, { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/slices/admin/adminSlice'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card'
import { Input } from '@/components/ui/input/Input'
import { Badge } from '@/components/ui/badge/Badge'
import { Loader2, Search, Check, X, Trash2, Star, MessageSquare, User, Package } from 'lucide-react'

export const ReviewsPage: React.FC = () => {
  const {
    reviews,
    reviewsLoading,
    reviewsError,
    getReviews,
    moderateReview,
  } = useAdminStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    getReviews()
  }, [getReviews])

  const handleModerateReview = async (reviewId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      await moderateReview(reviewId, action)
    } catch (error) {
      console.error('Failed to moderate review:', error)
    }
  }

  const filteredReviews = (Array.isArray(reviews) ? reviews : []).filter(review => {
    const matchesSearch = (review.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.userFirstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.userLastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || review.moderationStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number) => {
    const safeRating = rating || 0
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < safeRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (reviewsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
      </div>

      {reviewsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Error loading reviews: {reviewsError}</p>
          <Button 
            onClick={() => getReviews()} 
            className="mt-2"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reviews by product, user, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Reviews ({filteredReviews.length})</span>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{reviews.length} total</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {review.userFirstName || 'Unknown'} {review.userLastName || 'User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{review.productName || 'Unknown Product'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating || 0)}
                        </div>
                        <Badge className={getStatusColor(review.moderationStatus || 'pending')}>
                          {(review.moderationStatus || 'pending').charAt(0).toUpperCase() + (review.moderationStatus || 'pending').slice(1)}
                        </Badge>
                        {review.isVerified && (
                          <Badge variant="outline" className="text-green-600">Verified</Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{review.title || 'No Title'}</h3>
                      <p className="text-gray-700 mb-4">{review.content || 'No content'}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Posted {formatDate(review.createdAt || new Date().toISOString())}</span>
                        {review.moderationNotes && (
                          <span className="text-orange-600">
                            Notes: {review.moderationNotes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {(review.moderationStatus || 'pending') === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerateReview(review.id, 'approve')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerateReview(review.id, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerateReview(review.id, 'delete')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'No reviews match your filters' 
                  : 'No reviews found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 