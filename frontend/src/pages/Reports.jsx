import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  MessageCircle,
} from "lucide-react";
import { useFeedbackStore } from "../stores/useFeedbackStore";

export default function StudentReports() {
  const { allFeedback, getAllFeedback, isLoading } = useFeedbackStore();

  // Fetch real feedback on mount
  useEffect(() => {
    getAllFeedback();
  }, []);

  // Map API feedback records to the shape the existing UI uses
  const reports = allFeedback.map((f) => ({
    id: f._id,
    studentId: f.anonymous_id,
    studentName: f.student_name,
    counsellor: f.counsellor_name,
    date: f.date ? new Date(f.date).toISOString().split('T')[0] : '',
    sessionType: 'Individual',
    status: f.status
      ? f.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Stable',
    feedback: f.problems,
    recommendations: f.recommendations,
    priority: f.status === 'needs-support' ? 'high' : f.status === 'improved' ? 'low' : 'medium',
  }));

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Function to handle printing the report
 const printSingleReport = (report) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Report - ${report.studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .report-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { margin-bottom: 15px; }
            .label { font-weight: bold; color: #333; margin-bottom: 5px; }
            .value { color: #555; }
            .status-badge { padding: 8px 15px; border-radius: 20px; font-weight: bold; display: inline-block; }
            .status-improved { background-color: #d4edda; color: #155724; }
            .status-needs-support { background-color: #f8d7da; color: #721c24; }
            .status-stable { background-color: #cce7ff; color: #004085; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .content-box { padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
            .feedback { background-color: #f8f9fa; }
            .recommendations { background-color: #e7f3ff; border-left: 4px solid #007bff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Counseling Report</h1>
            <h2>${report.studentName}</h2>
            <p>Student ID: ${report.studentId}</p>
            <p>Report Generated: ${currentDate}</p>
          </div>
          
          <div class="report-info">
            <div class="info-item">
              <div class="label">Counselor:</div>
              <div class="value">${report.counsellor}</div>
            </div>
            <div class="info-item">
              <div class="label">Session Date:</div>
              <div class="value">${new Date(report.date).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="label">Session Type:</div>
              <div class="value">${report.sessionType}</div>
            </div>
            <div class="info-item">
              <div class="label">Status:</div>
              <div class="value">
                <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="label">Priority Level:</div>
              <div class="value">${report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Session Feedback</div>
            <div class="content-box feedback">${report.feedback}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Recommendations</div>
            <div class="content-box recommendations">${report.recommendations}</div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.counsellor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      report.status.toLowerCase().replace(" ", "_") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Improved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Needs Support":
        return "bg-red-100 text-red-800 border-red-200";
      case "Stable":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 🔹 Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Blue Patches - Static */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30"></div>
        <div className="absolute top-5/7 right-1/4 w-56 h-56 bg-gradient-to-tl from-blue-100 to-blue-400 rounded-full opacity-25"></div>
      </div>

      {/* 🔹 Foreground Content */}
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Student Reports Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor student progress and counseling outcomes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Need Support</p>
                <p className="text-2xl font-bold text-red-600">
                  {reports.filter((r) => r.status === "Needs Support").length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <User className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improved</p>
                <p className="text-2xl font-bold text-green-600">
                  {reports.filter((r) => r.status === "Improved").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by student name, ID, or counselor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="improved">Improved</option>
                  <option value="needs_support">Needs Support</option>
                  <option value="stable">Stable</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Student
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Counselor
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Priority
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {report.studentName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {report.studentId}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-gray-900">
                          {report.counsellor}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getPriorityColor(
                            report.priority
                          )}`}
                        ></div>
                        <span className="text-gray-600 capitalize">
                          {report.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No reports found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedReport.studentName}
                    </h3>
                    <p className="text-gray-500">{selectedReport.studentId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Counselor
                    </label>
                    <p className="text-gray-900">
                      {selectedReport.counsellor}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Date
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedReport.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Type
                    </label>
                    <p className="text-gray-900">{selectedReport.sessionType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedReport.status
                      )}`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      {selectedReport.feedback}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommendations
                  </label>
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <p className="text-gray-700">
                      {selectedReport.recommendations}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => printSingleReport(selectedReport)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
