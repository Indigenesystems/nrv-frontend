"use client";

import React, { useState, useEffect, useMemo } from "react";
import LoadingPage from "../../../../components/loaders/LoadingPage";
import Button from "../../../../components/shared/buttons/Button";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import TenantLayout from "../../../../components/layout/TenantLayout";
import { getPropertyByIdForTenant } from "../../../../../redux/slices/propertySlice";
import { TenantPropertyApplicationPanel } from "@/app/components/tenant/TenantPropertyApplicationPanel";
import {
  mapTenantRoomForApplication,
  mapTenantRoomImageUrls,
} from "@/app/lib/mapTenantRoomForApplication";
import GoogleMapReact from "google-map-react";
import CenterModal from "../../../../components/shared/modals/CenterModal";
import copy from "copy-to-clipboard";
import { FaCheckCircle } from "react-icons/fa";
import BackIcon from "@/app/components/shared/icons/BackIcon";

import { SlCloudUpload } from "react-icons/sl";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Copy,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  Star,
  Twitter,
  User,
  MapPin,
  Calendar,
  Bed,
  Bath,
  Home,
  Building,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { API_URL } from "@/config/constant";
import WatermarkedImage from "@/app/components/shared/WatermarkedImage";
import {
  getOccupancyLabel,
  isPropertyOccupied,
  normalizeAmenities,
} from "@/helpers/utils";

/** Ensure image URL is absolute so it loads from backend/Cloudinary when relative */
function toAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = API_URL.replace(/\/$/, "");
  return u.startsWith("/") ? `${base}${u}` : `${base}/${u}`;
}

const formatAddress = (addr: string) => {
  if (!addr) return "—";
  let formatted = addr;
  let prev = "";
  while (formatted !== prev) {
    prev = formatted;
    formatted = formatted.replace(/^(?:no\.?\s+|plot\s+|block\s+)?\d+[a-zA-Z]?\s*,?\s*/i, '');
  }
  return formatted.trim() || addr;
};

function deriveMonthlyYearly(rent: number, metrics?: string) {
  const m = (metrics || "").toLowerCase();
  if (m.includes("month")) {
    return { monthly: rent, yearly: rent * 12 };
  }
  if (m.includes("quarter")) {
    return { monthly: Math.round(rent / 3), yearly: rent * 4 };
  }
  if (m.includes("annual") || m.includes("annually")) {
    return { monthly: Math.round(rent / 12), yearly: rent };
  }
  if (rent >= 300_000) {
    return { monthly: Math.round(rent / 12), yearly: rent };
  }
  return { monthly: rent, yearly: rent * 12 };
}

const TenantPropertiesScreen = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>({});
  const [property, setProperty] = useState<any>({});
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<any>(1);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  /** City & state only — tenants never see street-level data in map search. */
  const mapSearchQuery = useMemo(() => {
    const a = (property?.address || "").trim();
    if (!a || a === "—") return "Lagos, Nigeria";
    return a.toLowerCase().includes("nigeria") ? a : `${a}, Nigeria`;
  }, [property?.address]);

  const mapEmbedSrc = useMemo(() => {
    const q = encodeURIComponent(mapSearchQuery);
    return `https://www.google.com/maps?q=${q}&z=14&output=embed`;
  }, [mapSearchQuery]);

  const mapsOpenHref = useMemo(() => {
    const q = encodeURIComponent(mapSearchQuery);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [mapSearchQuery]);

  const pricePerAnnum = useMemo(() => {
    const rent = Number(property?.price) || 0;
    if (!rent || rent <= 0) return 0;
    return deriveMonthlyYearly(rent, property?.rentAmountMetrics).yearly;
  }, [property?.price, property?.rentAmountMetrics]);

  const rentParts = useMemo(() => {
    const rent = Number(property?.price) || 0;
    if (!rent || rent <= 0) return null;
    const { monthly, yearly } = deriveMonthlyYearly(rent, property?.rentAmountMetrics);
    return {
      monthlyLabel: `₦${monthly.toLocaleString()}/mo`,
      yearlyLabel: `₦${yearly.toLocaleString()}/yr`,
    };
  }, [property?.price, property?.rentAmountMetrics]);

  const fetchData = async () => {
    const user = JSON.parse(localStorage.getItem("nrv-user") as any);
    setUser(user?.user);
    const body = {
      id: id,
      tenantId: user?.user?._id,
    };
    try {
      const response = await dispatch(getPropertyByIdForTenant(body) as any);
      const raw = response?.payload?.data?.property;
      const hasApplied = Boolean(response?.payload?.data?.hasApplied);
      const base = mapTenantRoomForApplication(raw, hasApplied);
      const mapped = {
        ...base,
        _id: raw?._id,
        imageUrl: raw?.propertyId?.file,
        imageUrls: mapTenantRoomImageUrls(raw),
        description: raw?.description,
        apartmentName: raw?.apartmentType,
        bedrooms: raw?.noOfRooms,
        bathrooms: raw?.noOfBaths,
        leaseTerms: raw?.leaseTerms,
        amenities: normalizeAmenities(raw?.otherAmentities),
        assignedToTenant: raw?.assignedToTenant,
        listRoom: raw?.listRoom,
      };
      setProperty(mapped);
      //setProperty(response?.payload?.data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const copyToClipboard = (text: any) => {
    let copyText = text;
    let isCopy = copy(copyText);
    if (isCopy) {
      toast.success(
        "Link copied, you can share this on your social media handle.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          style: {
            background: "#ffffff",
            color: "#153969",
          },
          progressStyle: {
            background: "#153969",
          },
          icon: <FaCheckCircle size={25} style={{ color: "#153969" }} />,
        }
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When viewing a different property (route id changes), reset gallery index
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [id]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showImageModal || !property.imageUrls || property.imageUrls.length <= 1) return;
      
      if (event.key === 'ArrowLeft') {
        setSelectedImageIndex(prev => 
          prev === 0 ? property.imageUrls.length - 1 : prev - 1
        );
      } else if (event.key === 'ArrowRight') {
        setSelectedImageIndex(prev => 
          prev === property.imageUrls.length - 1 ? 0 : prev + 1
        );
      } else if (event.key === 'Escape') {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImageModal, property.imageUrls]);

  // Reset image states only when the current image URL actually changes (avoids spinner reappearing on re-renders)
  const currentImageUrl = property.imageUrls?.[selectedImageIndex] ?? property.imageUrls?.[0];
  useEffect(() => {
    if (!property.imageUrls || property.imageUrls.length === 0) {
      setImageLoading(false);
      setImageError(false);
      return;
    }
    setImageLoading(true);
    setImageError(false);
  }, [currentImageUrl]);

  // Timeout fallback: stop loader if image never loads (broken URL, CORS, etc.)
  useEffect(() => {
    if (!property.imageUrls?.length || !imageLoading) return;
    const t = setTimeout(() => {
      setImageLoading(false);
      setImageError(true);
    }, 10000);
    return () => clearTimeout(t);
  }, [property.imageUrls, selectedImageIndex, imageLoading]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="pb-10 bg-gray-50 min-h-screen">
        <TenantLayout mainPath="/dashboard/tenant/properties">
          {isLoading ? (
            <div className="mx-auto max-w-7xl space-y-6 p-3 animate-pulse sm:space-y-8 sm:p-4 md:p-8">
              {/* Header Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="border-l h-6 mx-2"></div>
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              {/* Main Content Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-80 bg-gray-200"></div>
                    <div className="p-4 flex gap-2 overflow-hidden">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      ))}
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Property Info Card Skeleton */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-3 w-1/2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentStep === 1 && (
              <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-8">
                {/* Enhanced Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
                    {/* Left Side: Back + Titles */}
                    <div className="flex items-start md:items-center gap-4">
                      <BackIcon />
                      <div className="border-l h-6 mx-2 hidden md:block"></div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                          View Property Details
                        </h2>
                        <p className="text-gray-600 text-base">
                          {property?.apartmentName} • {property?.apartmentStyle}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
            

                      <div className="flex items-center gap-3">
                        <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Image and Apply Button */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Image Gallery */}
                      <div className="relative">
                        {/* Main Image */}
                        <div className="relative h-80 overflow-hidden">
                          {imageLoading && property.imageUrls?.length > 0 && (
                            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                            </div>
                          )}
                          
                          {imageError && property.imageUrls?.length > 0 && (
                            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">Image failed to load</p>
                              </div>
                            </div>
                          )}
                          
                          {!property.imageUrls || property.imageUrls.length === 0 ? (
                            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">No images available</p>
                              </div>
                            </div>
                          ) : (
                            <WatermarkedImage
                              src={property.imageUrls[selectedImageIndex]}
                              alt="property"
                              wrapperClassName="w-full h-full"
                              imageClassName={`w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105 ${
                                imageLoading || imageError
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                              overlayClassName={`${
                                imageLoading || imageError
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                              variant="default"
                              onClick={() => setShowImageModal(true)}
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          
                          {/* Image Navigation Arrows */}
                          {property.imageUrls && property.imageUrls.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImageIndex(prev => 
                                    prev === 0 ? property.imageUrls.length - 1 : prev - 1
                                  );
                                }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                              >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImageIndex(prev => 
                                    prev === property.imageUrls.length - 1 ? 0 : prev + 1
                                  );
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                              >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                        
                        {/* Image Thumbnails */}
                        {property.imageUrls && property.imageUrls.length > 1 && (
                          <div className="p-4 bg-gray-50">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {property.imageUrls.map((imageUrl: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                    index === selectedImageIndex 
                                      ? 'border-green-500 ring-2 ring-green-200' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="relative w-full h-full">
                                    <WatermarkedImage
                                      src={imageUrl}
                                      alt={`Property ${index + 1}`}
                                      wrapperClassName="w-full h-full"
                                      imageClassName="w-full h-full object-cover"
                                      variant="compact"
                                      onLoad={() => {
                                        if (index === selectedImageIndex) {
                                          setImageLoading(false);
                                          setImageError(false);
                                        }
                                      }}
                                      onError={() => {
                                        if (index === selectedImageIndex) {
                                          setImageLoading(false);
                                          setImageError(true);
                                        }
                                      }}
                                    />
                                    {index === selectedImageIndex && (
                                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-2">
                              {selectedImageIndex + 1} of {property.imageUrls.length} images
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Apply Button */}
                      <div className="p-6">
                        <Button
                         variant="darkPrimary"
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg"
                          onClick={() => setCurrentStep(2)}
                          disabled={property.hasApplied === true}
                        >
                          {property.hasApplied === true ? "You have applied to this unit" : "Apply Now!"}
                        </Button>
                        
                        {property.hasApplied && (
                          <p className="text-center text-green-600 text-sm mt-3 font-medium">
                             Application submitted successfully
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Property Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Price and Contact Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <p className="text-gray-500 text-sm font-medium">Price (Per Annum)</p>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isPropertyOccupied(property)
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                              }`}
                            >
                              {getOccupancyLabel(property)}
                            </span>
                          </div>
                          {pricePerAnnum > 0 ? (
                            <>
                              <h3 className="text-3xl font-bold text-green-700">
                                ₦{pricePerAnnum.toLocaleString()}
                              </h3>
                              {rentParts ? (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-semibold text-green-700">
                                    {rentParts.monthlyLabel}
                                  </span>
                                  <span className="text-gray-400 mx-2">·</span>
                                  <span>{rentParts.yearlyLabel}</span>
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <h3 className="text-xl font-bold text-gray-800">Price on request</h3>
                          )}
                        </div>
                        <Button
                          variant="darkPrimary"
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors"
                          onClick={() => setIsModalOpen(true)}
                        >
   
                          Contact Owner
                        </Button>
                      </div>

                      {/* Key Features Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-center mb-2">
                            <Home className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-gray-500 text-xs font-medium mb-1">Style</p>
                          <p className="text-gray-800 font-semibold">{property?.apartmentStyle}</p>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-center mb-2">
                            <Bed className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-gray-500 text-xs font-medium mb-1">Bedrooms</p>
                          <p className="text-gray-800 font-semibold">{property?.bedrooms}</p>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-center mb-2">
                            <Bath className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-gray-500 text-xs font-medium mb-1">Bathrooms</p>
                          <p className="text-gray-800 font-semibold">{property?.bathrooms}</p>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-center mb-2">
                            <Building className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-gray-500 text-xs font-medium mb-1">Unit #</p>
                          <p className="text-gray-800 font-semibold">{property?.flatNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Location and Description */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-1/3">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              <p className="text-gray-500 text-sm font-medium">Location</p>
                            </div>
                            <p className="text-gray-800 font-medium leading-relaxed">
                              {property?.address}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Street address is shared by the landlord when you schedule a viewing.
                            </p>
                          </div>
                          <div className="w-2/3">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <p className="text-gray-500 text-sm font-medium">Lease Terms</p>
                            </div>
                            <p className="text-gray-800 font-medium">
                              {property?.leaseTerms}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-gray-500 text-sm font-medium mb-3">Description</p>
                          <p className="text-gray-800 leading-relaxed text-sm font-light ">
                            {property?.description}
                          </p>
                        </div>
                        {property?.paymentOption ? (
                          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm">
                            <p className="text-xs text-gray-500 mb-1">Payment option</p>
                            <p className="font-semibold text-gray-800">{property.paymentOption}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        Apartment Facilities & Amenities
                      </h4>
                      {property?.amenities?.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-800">
                          {property.amenities.map(
                            (amenity: string, idx: number) => (
                              <li key={`${amenity}-${idx}`}>{amenity}</li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No amenities listed</p>
                      )}
                    </div>

                    {/* Map — property address search (same embed pattern as public listing page) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-6 pt-6 pb-2">
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">Location map</h4>
                        <p className="text-sm text-gray-500">
                          Approximate area from city and state. The landlord shares the full street
                          address when you arrange a viewing.
                        </p>
                      </div>
                      <div className="relative aspect-[16/10] sm:aspect-[2/1] min-h-[220px] bg-gray-100 mx-6 mb-2 rounded-xl overflow-hidden">
                        <iframe
                          title="Approximate area map"
                          src={mapEmbedSrc}
                          className="absolute inset-0 z-0 h-full w-full border-0 grayscale-[0.15]"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
                          <div className="pointer-events-auto p-3">
                            <a
                              href={mapsOpenHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open in Maps
                            </a>
                          </div>
                          <div className="flex flex-1 items-start justify-center pt-4 sm:pt-8">
                            <span className="rounded-md bg-gray-900/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg whitespace-nowrap">
                              Approximate area
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="px-6 pb-6 text-xs text-gray-500">
                        Map uses city and state only. Confirm the exact location with the landlord
                        before paying rent.
                      </p>
                    </div>

                    {/* Owner Information */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            {property?.owner?.name}
                          </h4>
                          <p className="text-gray-600 text-sm mb-2">
                            {property?.owner?.email}
                          </p>
                          <div className="flex items-center text-sm text-yellow-600">
                            <Star className="w-4 h-4 mr-1" fill="currentColor" />
                            {property?.owner?.reviews != null
                              ? `${property.owner.reviews} Reviews`
                              : "Owner"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <TenantPropertyApplicationPanel
                variant="page"
                property={property}
                propertyId={id as string}
                user={user}
                onBack={() => setCurrentStep(1)}
                onSuccess={() => {
                  router.push("/dashboard/tenant/properties");
                }}
              />
            )}

          {/* Enhanced Contact Modal */}
          <CenterModal
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
            }}
          >
            <div className="mx-auto max-w-md p-4 sm:p-8">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    copyToClipboard(
                      `https://nrv-frontend.vercel.app/dashboard/tenant/properties/${property._id}`
                    );
                  }}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Contact Information
                </h2>
                <p className="text-gray-600">
                  Get in touch with the property owner
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                    <p className="text-gray-800 font-semibold">{property?.owner?.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email Address</p>
                    <p className="text-gray-800 font-semibold">{property?.owner?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  size="large"
                  variant="darkPrimary"
                  showIcon={false}
                  className="w-full !bg-[#03442C] hover:!bg-[#03442C]/90 !text-white"
                >
                  Send Message
                </Button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-8 py-3 text-sm font-medium rounded-full border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </CenterModal>

          {/* Enhanced Dialog Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-800">
                  <User className="h-5 w-5 text-green-600" />
                  Contact Information
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Name</p>
                    <p className="font-semibold text-gray-800">{property?.owner?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <p className="font-semibold text-gray-800">{property?.owner?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                    <p className="font-semibold text-gray-800">{property?.owner?.phoneNumber}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link className="flex-1" href={`tel:${property?.owner?.phoneNumber}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" variant="darkPrimary">
                    <div className="flex items-center gap-2 py-1">
                      <Phone className="h-4 w-4" />
                      Call
                    </div>
                  </Button>
                </Link>
                <Link className="flex-1" href={`mailto:${property?.owner?.email}`}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" variant="darkPrimary">
                    <div className="flex items-center gap-2 py-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </Button>
                </Link>
              </div>
            </DialogContent>
          </Dialog>

          {/* Image Modal */}
          <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-gray-800">
                  <span>Property Images</span>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </DialogTitle>
              </DialogHeader>
              
              <div className="relative">
                {/* Main Image Display */}
                <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg">
                  {!property.imageUrls || property.imageUrls.length === 0 ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No images available</p>
                      </div>
                    </div>
                  ) : (
                    <WatermarkedImage
                      src={property.imageUrls[selectedImageIndex]}
                      alt="property"
                      wrapperClassName="w-full h-full"
                      imageClassName="w-full h-full object-contain"
                      variant="default"
                    />
                  )}
                  
                  {/* Navigation Arrows */}
                  {property.imageUrls && property.imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === 0 ? property.imageUrls.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === property.imageUrls.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {property.imageUrls && property.imageUrls.length > 1 && (
                  <div className="mt-4">
                    <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                      {property.imageUrls.map((imageUrl: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === selectedImageIndex 
                              ? 'border-green-500 ring-2 ring-green-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <WatermarkedImage
                            src={imageUrl}
                            alt={`Property ${index + 1}`}
                            wrapperClassName="w-full h-full"
                            imageClassName="w-full h-full object-cover"
                            variant="compact"
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-3">
                      {selectedImageIndex + 1} of {property.imageUrls.length} images
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TenantLayout>
    </div>
  );
};

export default TenantPropertiesScreen;
