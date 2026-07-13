"use client";

import React from "react";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";

const APPOINTMENTS = [
    {
        id: "GH-1024",
        service: "GP Consultation",
        date: "20 Dec 2024",
        time: "10:30 AM",
        doctor: "Dr. Sarah Mitchell",
        status: "Scheduled",
        type: "Online"
    },
    {
        id: "GH-0982",
        service: "Blood Analysis",
        date: "15 Dec 2024",
        time: "09:00 AM",
        doctor: "Dr. Robert Wilson",
        status: "Completed",
        type: "In-Clinic"
    },
    {
        id: "GH-0871",
        service: "Flu Vaccination",
        date: "05 Dec 2024",
        time: "14:15 PM",
        doctor: "Nurse James Chen",
        status: "Completed",
        type: "In-Clinic"
    },
    {
        id: "GH-0755",
        service: "Health Screening",
        date: "12 Nov 2024",
        time: "11:00 AM",
        doctor: "Dr. Emily Brooks",
        status: "Cancelled",
        type: "In-Clinic"
    }
];

export default function AppointmentsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="pb-4 border-b border-gray-200">
                <h1 className="ghc-page-title">My Appointments</h1>
                <p className="ghc-text-body mt-1">View and manage your healthcare appointments</p>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="ghc-table-header px-6 py-3 text-left">Appointment ID</th>
                                <th className="ghc-table-header px-6 py-3 text-left">Service</th>
                                <th className="ghc-table-header px-6 py-3 text-left">Healthcare Provider</th>
                                <th className="ghc-table-header px-6 py-3 text-left">Date & Time</th>
                                <th className="ghc-table-header px-6 py-3 text-left">Type</th>
                                <th className="ghc-table-header px-6 py-3 text-left">Status</th>
                                <th className="ghc-table-header px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {APPOINTMENTS.map((apt) => (
                                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${apt.status === 'Completed' ? 'bg-green-50' :
                                                apt.status === 'Cancelled' ? 'bg-red-50' : 'bg-blue-50'
                                                }`}>
                                                {apt.status === 'Completed' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                                                    apt.status === 'Cancelled' ? <XCircle className="h-4 w-4 text-red-600" /> :
                                                        <Calendar className="h-4 w-4 text-blue-600" />}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{apt.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">{apt.service}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-900">{apt.doctor}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{apt.date}</div>
                                        <div className="text-xs text-gray-500">{apt.time}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-gray-700">
                                            {apt.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${apt.status === 'Completed' ? 'bg-green-600' :
                                                apt.status === 'Cancelled' ? 'bg-red-600' : 'bg-blue-600'
                                                }`} />
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-[var(--maincolor)] hover:text-[var(--maincolor)]/80 text-sm font-medium">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Showing {APPOINTMENTS.length} appointment{APPOINTMENTS.length !== 1 ? 's' : ''}
                </p>
                <button className="text-[var(--maincolor)] text-sm font-medium hover:underline">
                    Book New Appointment
                </button>
            </div>
        </div>
    );
}
