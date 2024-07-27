"use client";


import Image from "next/image";
import { formatDate } from "../../../helpers/utils";
import Button from "../shared/buttons/Button";
import { useRouter } from 'next/navigation';


interface MaintenanceCardProps {
  title: string;
  description: number;
  dateLogged: string;
  status: any;
  id: string;
}


const MaintainanceCard: React.FC<MaintenanceCardProps> = ({
  title,
  description,
  dateLogged,
  status,
  id
}) => {

  const router = useRouter();
  return (
    <div className="md:w-4/5 w-full rounded-lg border border-nrvGreyMediumBg bg-white p-5 mb-8 h-50">
      <div className="flex gap-3 items-center">
        <div className="w-full flex gap-4 justify-between space-between">
          <div className="flex justify-between space-around text-nrvLightGrey">
            <div className="text-md text-nrvDarkBlue">{title}</div>
          </div>
          <div>
                    <Button
                    
                      className={`w-full  text-md ${status === "Resolved" ? 'bg-[#107E4B] text-white' : 'bg-nrvDarkBlue text-white'}`}
                      variant="ordinary"
                      size="small"
                      showIcon={false}
                  
                    >
                    {status}
                    </Button>
                    </div>
        </div>
      </div>

      <div>
        {/* <div className="mb-1 mt-4 text-sm font-medium">Description:</div> */}
        <div className="mb-4 font-light text-sm truncate mt-4">{description}</div>
        <div className="text-[11px] font-medium text-nrvLightGrey">
          {formatDate(dateLogged.slice(0, 10))}
        </div>
        <div className="flex gap-4 w-full justify-center items-center mt-2">
          {/* <Button
            size="small"
            className="px-5"
            variant="whitebg"
            showIcon={false}
            onClick={() => {
               router.push(`/dashboard/tenant/rented-properties/maintenance/single/${id}`)
            }}
          >
            Cancel
          </Button> */}
          <Button
            size="small"
            className="px-5"
            variant="whitebg"
            showIcon={false}
            onClick={() => {
              router.push(`/dashboard/tenant/rented-properties/maintenance/single/${id}`)
            }}
          >
            Open Request
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaintainanceCard;