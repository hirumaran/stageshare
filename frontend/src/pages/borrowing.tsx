import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeftRight,
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  MessageSquare,
  PackageOpen,
  Ban,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import { useMatrixStore } from "@/stores/matrix-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate, getInitials, truncate } from "@/lib/utils"
import { toast } from "sonner"
import type { BorrowRequest } from "@/types"

const statusConfig: Record<
  BorrowRequest["status"],
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-warning text-warning-foreground",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-success text-success-foreground",
    icon: Check,
  },
  active: {
    label: "Active — Out on Loan",
    color: "bg-primary text-primary-foreground",
    icon: PackageOpen,
  },
  rejected: {
    label: "Rejected",
    color: "bg-destructive text-destructive-foreground",
    icon: X,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground",
    icon: Ban,
  },
  returned: {
    label: "Returned",
    color: "bg-muted text-muted-foreground",
    icon: Check,
  },
  overdue: {
    label: "Overdue",
    color: "bg-destructive text-destructive-foreground",
    icon: AlertCircle,
  },
}

export default function BorrowingPage() {
  const { user } = useAuthStore()
  const { borrowRequests, fetchBorrowRequests, updateBorrowRequest } = useUIStore()
  const { createOrGetDMRoom, setActiveRoom, sendMessage } = useMatrixStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchBorrowRequests()
  }, [fetchBorrowRequests])

  const handleMessageAboutRequest = async (request: BorrowRequest) => {
    if (!request.ownerMatrixUserId) {
      toast.error("This user is not yet on the messaging system.")
      return
    }

    try {
      const roomId = await createOrGetDMRoom(request.ownerMatrixUserId)
      await sendMessage(
        roomId,
        `Hi! Following up on my borrow request for **${request.resource.title}** ` +
          `(${formatDate(request.startDate)} – ${formatDate(request.endDate)}).`
      )
      setActiveRoom(roomId)
      navigate("/messages")
    } catch (err) {
      console.error("[Messages] Failed to start conversation:", err)
      toast.error("Could not start conversation. Please try again.")
    }
  }

  // Requests where I am the borrower
  const myRequests = borrowRequests.filter((r) => r.borrowerId === user?.id)
  // Requests for my resources (I am the owner)
  const incomingRequests = borrowRequests.filter((r) => r.ownerId === user?.id)

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending")
  const activeIncoming = incomingRequests.filter(
    (r) => r.status === "approved" || r.status === "active" || r.status === "overdue"
  )

  const handleApprove = (requestId: string) => {
    updateBorrowRequest(requestId, "approved", "Approved! Let me know when you can pick it up.")
    toast.success("Request approved")
  }

  const handleReject = (requestId: string) => {
    updateBorrowRequest(requestId, "rejected", "Sorry, this item is not available at this time.")
    toast.success("Request rejected")
  }

  const handlePickup = (requestId: string) => {
    updateBorrowRequest(requestId, "active")
    toast.success("Marked as picked up")
  }

  const handleMarkReturned = (requestId: string) => {
    updateBorrowRequest(requestId, "returned")
    toast.success("Marked as returned")
  }

  const RequestCard = ({
    request,
    showActions = false,
    isIncoming = false,
  }: {
    request: BorrowRequest
    showActions?: boolean
    isIncoming?: boolean
  }) => {
    const config = statusConfig[request.status]
    const StatusIcon = config.icon
    const otherUser = isIncoming ? request.borrower : request.owner

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Resource image */}
            <div className="h-20 w-20 rounded-md bg-muted overflow-hidden flex-shrink-0">
              {request.resource.images[0] ? (
                <img
                  src={request.resource.images[0]}
                  alt={request.resource.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/resource/${request.resourceId}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {truncate(request.resource.title, 40)}
                  </Link>
                  <Badge className={cn("ml-2 capitalize", config.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </div>

              {/* User info */}
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={otherUser.avatar} />
                  <AvatarFallback className="text-xs">
                    {getInitials(otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {isIncoming ? "Request from" : "Owner:"} {otherUser.name}
                </span>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </span>
                </div>
              </div>

              {/* Message */}
              {request.message && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  &ldquo;{truncate(request.message, 100)}&rdquo;
                </p>
              )}

              {/* Actions */}
              {showActions && request.status === "pending" && isIncoming && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(request.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}

              {showActions &&
                request.status === "approved" &&
                isIncoming && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handlePickup(request.id)}
                    >
                      <PackageOpen className="h-4 w-4 mr-1" />
                      Mark as Picked Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkReturned(request.id)}
                    >
                      Mark as Returned
                    </Button>
                  </div>
                )}

              {showActions &&
                request.status === "active" &&
                isIncoming && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkReturned(request.id)}
                    >
                      Mark as Returned
                    </Button>
                  </div>
                )}

              {(request.status === "approved" || request.status === "active") &&
                !isIncoming && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMessageAboutRequest(request)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message {request.owner.name.split(" ")[0]}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Borrowing</h1>
        <p className="text-muted-foreground">
          Manage your borrow requests and track borrowed items
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {pendingIncoming.length}
            </div>
            <p className="text-sm text-muted-foreground">Pending Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {activeIncoming.length}
            </div>
            <p className="text-sm text-muted-foreground">Active Loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {myRequests.filter((r) => r.status === "approved" || r.status === "active").length}
            </div>
            <p className="text-sm text-muted-foreground">Items I&apos;m Borrowing</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming Requests ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="my-requests">
            My Requests ({myRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-4 space-y-4">
          {incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No incoming requests</h3>
                <p className="text-muted-foreground text-center">
                  When someone requests to borrow your resources, they&apos;ll appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {pendingIncoming.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Pending Approval ({pendingIncoming.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingIncoming.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        showActions
                        isIncoming
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeIncoming.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Active Loans ({activeIncoming.length})
                  </h3>
                  <div className="space-y-3">
                    {activeIncoming.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        showActions
                        isIncoming
                      />
                    ))}
                  </div>
                </div>
              )}

              {incomingRequests.filter(
                (r) => r.status === "returned" || r.status === "rejected" || r.status === "cancelled"
              ).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">History</h3>
                  <div className="space-y-3">
                    {incomingRequests
                      .filter(
                        (r) => r.status === "returned" || r.status === "rejected" || r.status === "cancelled"
                      )
                      .map((request) => (
                        <RequestCard key={request.id} request={request} isIncoming />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="mt-4 space-y-4">
          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Browse the catalogue to find resources to borrow
                </p>
                <Button asChild>
                  <Link to="/catalogue">Browse Catalogue</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
