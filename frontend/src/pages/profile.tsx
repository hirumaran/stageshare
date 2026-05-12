import { Link, useNavigate } from "react-router-dom"
import { mockResources } from "@/data/mock-data"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileCard } from "@/components/ui/profile-card"
import { ResourceCard } from "@/components/resource-card"
import { Mail, GraduationCap, MessageSquare, Calendar, Edit } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ProfilePage() {
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()

  const profileUser = currentUser
  const isOwnProfile = true

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userResources = mockResources.filter((r) => r.ownerId === profileUser.id)
  const surfaceClass =
    "border-black/10 bg-white/[0.78] shadow-[0_16px_50px_rgba(40,30,20,0.14)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#24201d]/[0.82] dark:shadow-[0_16px_50px_rgba(0,0,0,0.26)]"
  const profileHandle = `@${profileUser.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "")}`

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 pb-12 md:px-10">
      {/* Profile Header */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(18rem,26rem)_1fr]">
        <ProfileCard
          className="mx-auto lg:mx-0"
          name={profileUser.name}
          handle={profileHandle}
          timestamp={`Joined ${formatDate(profileUser.joinedAt)}`}
          imageSrc={profileUser.avatar}
          avatarSrc={profileUser.avatar}
          actionLabel={isOwnProfile ? "Edit profile" : "Message"}
          onAction={() => {
            if (isOwnProfile) {
              navigate("/settings")
            } else {
              navigate(`/messages?user=${profileUser.id}`)
            }
          }}
        />
        <Card className={surfaceClass}>
          <CardContent className="flex h-full flex-col justify-center p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-primary">
                  Drama educator
                </p>
                <h1 className="mb-4 font-serif text-3xl font-medium tracking-tight text-slate-900 dark:text-[#F0E9DF] md:text-5xl">
                  {profileUser.name}
                </h1>
                <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {profileUser.school && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      <span>{profileUser.school}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(profileUser.joinedAt)}</span>
                  </div>
                </div>
                {profileUser.bio && (
                  <p className="max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-white/75 md:text-base">
                    {profileUser.bio}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/messages?user=${profileUser.id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={surfaceClass}>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              {profileUser.resourcesShared}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Resources Shared
            </p>
          </CardContent>
        </Card>
        <Card className={surfaceClass}>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              {profileUser.resourcesBorrowed}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Resources Borrowed
            </p>
          </CardContent>
        </Card>
        <Card className={surfaceClass}>
          <CardContent className="p-4 md:p-6 text-center">
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              {userResources.reduce((sum, r) => sum + r.borrowCount, 0)}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Times Borrowed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">
            Resources ({userResources.length})
          </TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="mt-6">
          {userResources.length === 0 ? (
            <Card className={surfaceClass}>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No resources shared yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} showOwner={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card className={surfaceClass}>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{profileUser.email}</p>
                </div>
              </div>
              {profileUser.school && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">School</p>
                    <p className="text-sm">{profileUser.school}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
