"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileSidebar from './ProfileSidebar';

export default function Addresses() {
  const pathname = usePathname();

  return (
    <div className="bg-[#F0F0F0] py-20 md:pt-[115px] min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex justify-center my-10">
          <h1 className="text-(--maincolor) text-2xl font-semibold">
            Addresses
          </h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-7">
          {/* Sidebar */}
          <ProfileSidebar />

          {/* Main Content Area */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm p-6 min-h-[400px]">
              {/* Page content */}

              <div className="py-4">
                <h3 className="text-lg leading-6 text-gray-900">
                  Hello <span className='font-medium'>John Doe </span>
                  (not John Doe? <Link href="/" className='!underline underline-offset-1'>Log out</Link> )
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-gray-500">
                  From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
                </p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Full name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      Margot Foster
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      margotfoster@example.com
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Phone number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      +1 234 567 890
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      About
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim incididunt cillum culpa consequat. Excepteur qui ipsum aliquip consequat sint. Sit id mollit nulla mollit nostrud in ea officia proident. Irure nostrud pariatur mollit ad adipisicing reprehenderit deserunt qui eu.
                    </dd>
                  </div>
                </dl>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}