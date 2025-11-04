import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')

    if (!reportType) {
      return NextResponse.json({ error: 'Report type is required' }, { status: 400 })
    }

    let csvData = ''
    let filename = ''

    if (reportType === 'supervisors') {
      // Generate supervisor performance report
      const supervisors = await prisma.supervisor.findMany({
        include: {
          user: true,
          students: true
        }
      })

      // CSV header
      csvData = 'Name,Email,Course,Current Students,Student Capacity\n'
      
      // CSV data
      supervisors.forEach(supervisor => {
        const studentCount = supervisor.students.length
        csvData += `"${supervisor.user.name}","${supervisor.user.email}","${(supervisor as any).course}",${studentCount},6\n`
      })

      filename = `supervisor-report-${new Date().toISOString().split('T')[0]}.csv`

    } else if (reportType === 'system') {
      // Generate system statistics report
      const [totalStudents, totalSupervisors, assignedStudents, unassignedStudents] = await Promise.all([
        prisma.student.count(),
        prisma.supervisor.count(),
        prisma.student.count({ where: { supervisorId: { not: null } } }),
        prisma.student.count({ where: { supervisorId: null } })
      ])

      // CSV header
      csvData = 'Metric,Value\n'
      
      // CSV data
      csvData += `"Total Students",${totalStudents}\n`
      csvData += `"Total Supervisors",${totalSupervisors}\n`
      csvData += `"Assigned Students",${assignedStudents}\n`
      csvData += `"Unassigned Students",${unassignedStudents}\n`
      csvData += `"Assignment Rate","${totalStudents > 0 ? ((assignedStudents / totalStudents) * 100).toFixed(1) : 0}%"\n`
      csvData += `"Report Generated","${new Date().toISOString()}"\n`

      filename = `system-report-${new Date().toISOString().split('T')[0]}.csv`

    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Return CSV file
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}