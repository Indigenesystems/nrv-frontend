import { useEffect, useRef, useState } from "react";
import Button from "../../shared/buttons/Button";
import { useDispatch, useSelector } from "react-redux";
import { verifyAccount } from "@/redux/slices/userSlice";
import { useRouter } from "next/navigation";
import { IoIosArrowBack } from "react-icons/io";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignUpVerifyAccount: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [inputNum, setInputNum] = useState<number>(1);
  const { error } = useSelector((state: any) => state.user);
  const [verifyCode, setVerifyCode] = useState<any[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // New loading state

  useEffect(() => {
    inputRefs.current[inputNum - 1]?.focus();
  }, [inputNum]);

  const handleSubmit = async () => {
    const formattedCode = verifyCode.join("");
    const user = JSON.parse(localStorage.getItem("emailToVerify") || "{}");

    const payload = {
      email: user?.data?.email,
      confirmationCode: formattedCode,
    };
    setIsLoading(true);
    await dispatch(verifyAccount(payload) as any)
      .unwrap()
      .then(() => {
        const _formattedUser = JSON.parse(
          localStorage.getItem("nrv-user") || "{}"
        );
        const userAccountType =
          _formattedUser?.user?.data?.user?.accountType || "";

        if (userAccountType === "landlord") {
          router.push("/dashboard/landlord");
        } else if (userAccountType === "tenant") {
          router.push("/dashboard/tenant");
        }
        setIsLoading(false); 
      })
      .catch((error: any) => {
        toast.error(error);
      });
      setIsLoading(false); 
  };


  // Check if all inputs are filled
  const isVerifyCodeFilled = verifyCode.every((num) => num !== null);

  return (
    <main className="flex justify-center items-center bg-swSecondary50 mx-auto h-screen">
      <div className="w-full sm:w-3/5 p-2">
        <p className="text-2xl font-semibold text-swGray800 flex gap-2">
        <span>
              {" "}
              <IoIosArrowBack
              className="mt-1 hover:cursor-pointer"
                onClick={() => {
                  router.push("/");
                }}
              />{" "}
            </span>{" "}
          Check your mail!
        </p>
        <p className="text-center mt-2 mb-8 text-[0.86rem] flex items-center justify-center font-light mx-auto">
          <span className="">
            We just sent your a mail (samsunday@gmail.com). Enter the 6-digit
            code to verify your account.
          </span>
        </p>

        <p className="text-center text-nrvLightBlue mt-5 mb-8 text-[0.86rem] flex items-center justify-center font-light nrvLightBlue">
          Open an email app <br></br>
          Change email or Resend code in 00:59
        </p>
        <div className="flex gap-3 justify-center">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="border border-swGray300 text-swGray300 rounded-lg h-13 w-16 p-2"
            >
              <input
                type="text"
                className="w-full h-full text-2xl text-center focus:outline-none"
                placeholder="0"
                maxLength={1}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    const newVerifyCode = [...verifyCode];
                    newVerifyCode[index] = value;
                    setVerifyCode(newVerifyCode);
                    setInputNum(index === 5 ? 6 : index + 2);
                  } else {
                    setVerifyCode((prevArray) =>
                      prevArray.map((item, i) => (i === index ? 0 : item))
                    );
                    setInputNum(index);
                    const prevInputRef = inputRefs.current[index - 1];
                    prevInputRef?.focus();
                  }
                }}
              />
            </div>
          ))}
        </div>
        {showWarning && (
          <p className="text-center text-red-500 mb-8 mt-6">
            Please enter the complete verification code.
          </p>
        )}
        <div className="mt-24">
          <Button
            onClick={handleSubmit}
            size="large"
            className="block w-full"
            variant="lightGrey"
            showIcon={false}
            disabled={!isVerifyCodeFilled || isLoading} 
          >
            {isLoading ? "Loading..." : "Confirm"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default SignUpVerifyAccount;
