"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Models from "@/imports/models.import";
import { Dropdown, useSetState } from "@/utils/function.utils";
import { TextInput } from "@/components/common-components/textInput";
import TextArea from "@/components/common-components/textArea";
import { DatePicker } from "@/components/common-components/datePicker";
import CustomSelect from "@/components/common-components/dropdown";
import TimePicker from "@/components/common-components/timePicker";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import Select from "react-select";
import * as Yup from "yup";
import * as Validation from "../../../utils/validation.utils";
import { Failure, Success } from "@/components/common-components/toast";
import PrimaryButton from "@/components/common-components/primaryButton";
import { Loader } from "lucide-react";
import ProtectedRoute from "@/components/common-components/privateRouter";
import dynamic from "next/dynamic";
import LoadMoreDropdown from "@/components/common-components/loadMoreDropdown";
import BookingCalender from "@/components/common-components/bookingCalender";
import { AYURVEDIC_LOUNGE, getTimeIntervals } from "@/utils/constant.utils";
// import DateTimeField from "@/components/common-components/DateTimeField"

// Dynamically import DateTimeField to avoid hydration issues (if needed)
const DateTimeField = dynamic(
  () => import("@/components/common-components/DateTimeField"),
  { ssr: false }
);

const CreateWellnessLounge = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useSetState({
    seat_count: 0,
    session_link: "",
    price: 0,
    lounge_type: {},
    end_time: "",
    start_time: "",
    valid_to: "",
    valid_from: "",
    Description: "",
    title: "",
    categoryName: "",
    categoryList: [],
    thumbnail_image: "",
    errors: {},
    submitLoading: false,
    loading: false,
    interval: { label: "30 Minutes", value: 30 },
    slots: [],
    intrestedTopicsList: [],
    intrested_topics: [],
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      getCategoryList();
      getIntrestedTopics();
    }
  }, []);

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsedDate = moment(dateParam, "DD-MM-YYYY HH:mm:ss");
      setState({
        start_date: parsedDate?.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ"),
      });
    }
  }, [searchParams]);

  const getCategoryList = async () => {
    try {
      setState({ loading: true });
      const res = await Models.category.activeList();
      const Dropdowns = Dropdown(res?.results, "name");
      setState({ categoryList: Dropdowns, loading: false });
    } catch (error) {
      setState({ loading: false });

      console.log("error: ", error);
    }
  };

  const getIntrestedTopics = async () => {
    try {
      const res = await Models.auth.getIntrestedTopics();
      const filters = res?.results?.filter((item) => item?.id != 13);
      const Dropdownss = Dropdown(filters, "topic");
      const filter = Dropdownss?.filter((item) => item?.label !== "");
      setState({ intrestedTopicsList: filter });
      console.log("res", res);
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmit = async () => {
    try {
      setState({ submitLoading: true });
      let body = {
        description: state.description ? state.description : "",
        title: state.title,
        start_date: state.start_date
          ? moment(state.start_date).format("YYYY-MM-DD")
          : null,
        end_date: state.end_date
          ? moment(state.end_date).format("YYYY-MM-DD")
          : null,
        end_time: state.end_time
          ? moment(state.end_time).format("HH:mm:ss")
          : null,
        start_time: state.start_time
          ? moment(state.start_time).format("HH:mm:ss")
          : null,
        price: state.price ? state.price : 0,
        session_link: state.session_link,
        seat_count: state.seat_count,
        lounge_type: state.lounge_type ? state.lounge_type?.value : null,
        thumbnail_image: state.thumbnail_images,
        slot: state.lounge_type?.value == AYURVEDIC_LOUNGE ? state.slots : [],
        interval:
          state.lounge_type?.value == AYURVEDIC_LOUNGE && state.interval
            ? state.interval?.value
            : null,
        moderator: state.moderator?.value,
        intrested_topics:
          state?.intrested_topics?.length > 0
            ? state?.intrested_topics?.map((item) => item.value)
            : [],
        // lable: state?.lable || "",
      };
      console.log("✌️body --->", body);
      await Validation.createSession.validate(body, {
        abortEarly: false,
      });

      let formData = new FormData();
      formData.append("description", body.description);
      formData.append("title", body.title);
      formData.append("start_date", body.start_date);
      formData.append("end_date", body.end_date);
      formData.append("event_type", body.lounge_type);
      formData.append("price", body.price);
      formData.append("start_time", body.start_time);
      formData.append("end_time", body.end_time);
      formData.append("session_link", body.session_link);
      formData.append("seat_count", body.seat_count);
      formData.append("lounge_type", body.lounge_type);
      formData.append("interval", body.interval);
      formData.append("moderator", body.moderator);
      {
        body.intrested_topics?.map((item) =>
          formData.append("intrested_topics", item)
        );
      }
      formData.append("is_active", true);
      // if (body.lable) {
      //   formData.append("lable", body.lable);
      // }

      if (body.thumbnail_image) {
        formData.append("thumbnail", body.thumbnail_image);
      }

      const res = await Models.session.create(formData);
      createSlot(res);
      setState({ submitLoading: false });

      router.push("/wellness-lounge-list");
      Success(`New session ${state.title} has been successfully added to the ${state.lounge_type?.label} category for participants to access and engage as part of their ongoing wellness journey.
`);
    } catch (error) {
      if (
        error?.start_date &&
        Array.isArray(error.start_date) &&
        error.start_date.length > 0
      ) {
        Failure(error?.start_date[0]);
      } else if (
        error?.end_date &&
        Array.isArray(error.end_date) &&
        error.end_date.length > 0
      ) {
        Failure(error?.end_date[0]);
      } else if (
        error?.start_time &&
        Array.isArray(error.start_time) &&
        error.start_time.length > 0
      ) {
        Failure(error?.start_time[0]);
      } else if (
        error?.end_time &&
        Array.isArray(error.end_time) &&
        error.end_time.length > 0
      ) {
        Failure(error?.end_time[0]);
      }
      if (error instanceof Yup.ValidationError) {
        const validationErrors = {};
        error.inner.forEach((err) => {
          validationErrors[err.path] = err?.message;
        });
        console.log("validationErrors: ", validationErrors);

        setState({ errors: validationErrors });
        setState({ submitLoading: false });
      } else {
        setState({ submitLoading: false });
      }
    }
  };

  const createSlot = async (res) => {
    try {
      const promises = state.slots.map((slot) => {
        const body = {
          event: res?.id,
          date: slot.date,
          start_time: moment(state.start_time).format("HH:mm"),
          end_time: moment(state.end_time).format("HH:mm"),
          slots: slot.slot,
        };
        return Models.slot.create(body);
      });

      await Promise.all(promises); // ✅ wait until all complete
      // setState({ loading: false });
    } catch (error) {
      // setState({ loading: false });
      console.log("error: ", error);
    }
  };

  const loadMendorList = async (search, loadedOptions, { page }) => {
    try {
      const body = {
        group_name: "Mentor",
      };
      const res = await Models.user.userList(page, body);
      const dropdownsa = res?.results?.map((item) => ({
        value: item?.id,
        label: `${item?.first_name} ${item.last_name}`,
      }));

      return {
        options: dropdownsa,
        hasMore: !!res?.next,
        additional: {
          page: page + 1,
        },
      };
    } catch (error) {
      return {
        options: [],
        hasMore: false,
        additional: {
          page: page,
        },
      };
    }
  };

  return state.loading ? (
    <div className="container mx-auto flex justify-center items-center">
      <Loader />
    </div>
  ) : (
    <div className="container mx-auto">
      <div className="flex justify-center   ">
        <div className="w-full">
          <h2 className="md:text-[20px] text-sm  font-bold mb-3">
            Create Lounge Session
          </h2>
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <div className="border rounded-xl p-4 gap-4 flex flex-col ">
              <TextInput
                value={state.title}
                onChange={(e) => {
                  setState({
                    title: e.target.value,
                    errors: { ...state.errors, title: "" },
                  });
                }}
                placeholder="Title"
                title="Title"
                error={state.errors?.title}
                required
              />
              <TextArea
                name="Description"
                value={state.description}
                onChange={(e) => {
                  setState({ description: e.target.value });
                }}
                className="mt-2 w-full"
                placeholder="Description"
                title="Description"
              />
              {/* <div className="grid auto-rows-min gap-4 grid-cols-2">
                <DatePicker
                  placeholder="Start Date"
                  title="Start Date"
                  selectedDate={state.start_date}
                  onChange={(date) => {
                    console.log("date: ", date);
                    setState({
                      start_date: date,
                      end_date: null,
                      errors:{...state.errors, start_date:""}
                    });
                  }}
                  error={state.errors?.start_date}
                  required
                  fromDate={new Date()}
                  disablePastDates
                  
                  
                />
                <DatePicker
                  placeholder="End Date"
                  title="End Date"
                  selectedDate={state.end_date}
                  onChange={(date) => {
                    console.log("date: ", date);
                    setState({
                      end_date: date,
                      errors:{...state.errors, end_date:""}
                    });
                  }}
                  error={state.errors?.end_date}
                  required
                  fromDate={new Date(state.start_date)}
                  disablePastDates

                />
              </div> */}

              <div className="grid auto-rows-min gap-4 grid-cols-2">
                <DateTimeField
                  label={`Start Date & Time (Choose both date & time)`}
                  placeholder="Start Date & Time"
                  value={state.start_date}
                  onChange={(date) => {
                    setState({
                      ...state,
                      start_date: date,
                      start_time: date,
                      // end_date: null,
                      errors: {
                        ...state.errors,
                        start_date: "",
                        start_time: "",
                      },
                    });
                  }}
                  error={state.errors?.start_date || state.errors?.start_time}
                  required
                  fromDate={new Date()}
                />

                <DateTimeField
                  label="End Date & Time (Choose both date & time)"
                  placeholder="End Date & Time"
                  value={state.end_date}
                  onChange={(date) => {
                    setState({
                      ...state,
                      end_date: date,
                      end_time: date,
                      errors: { ...state.errors, end_date: "", end_time: "" },
                    });
                  }}
                  error={state.errors?.end_date || state.errors?.end_time}
                  required
                  fromDate={state.start_date}
                />
              </div>
              <CustomSelect
                options={state.categoryList}
                value={state.lounge_type?.value || ""}
                onChange={(value) =>
                  setState({
                    lounge_type: value,
                    errors: { ...state.errors, lounge_type: "" },
                  })
                }
                title="Lounge Type"
                error={state.errors?.lounge_type}
                required
              />
              {state.lounge_type?.value == AYURVEDIC_LOUNGE && (
                <>
                  <CustomSelect
                    options={getTimeIntervals}
                    value={state.interval?.value || ""}
                    onChange={(value) =>
                      setState({
                        interval: value,
                        errors: { ...state.errors, interval: "" },
                      })
                    }
                    title="Interval (In minutes)"
                    error={state.errors?.interval}
                    required
                  />
                  <BookingCalender
                    error={state.errors?.slot}
                    startDate={state.start_date}
                    endDate={state.end_date}
                    slotInterval={state.interval?.value || 30}
                    getSlots={(data) => {
                      setState({ slots: data });
                    }}
                  />
                </>
              )}
            </div>

            <div className="border rounded-xl p-4 gap-4 flex flex-col ">
              {/* <CustomSelect
                options={state.categoryList}
                value={state.lounge_type?.value || ""}
                onChange={(value) =>
                  setState({
                    lounge_type: value,
                    errors: { ...state.errors, lounge_type: "" },
                  })
                }
                title="Lounge Type"
                error={state.errors?.lounge_type}
                required
              /> */}
              <LoadMoreDropdown
                value={state.moderator}
                onChange={(value) => {
                  setState({
                    moderator: value,
                    errors: { ...state.errors, moderator: "" },
                  });
                }}
                height={"35px"}
                title="Select Mentor"
                error={state.errors?.moderator}
                required
                placeholder="Select Mentor"
                loadOptions={loadMendorList}
              />

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {"Topics"} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={state.intrested_topics}
                  isMulti
                  options={state.intrestedTopicsList || []}
                  placeholder="Select Topics"
                  onChange={(value) =>
                    setState({
                      intrested_topics: value,
                      errors: { ...state.errors, intrested_topics: "" },
                    })
                  }
                  className=" text-sm"
                  name="topics"
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                  menuPortalTarget={document.body}
                />
                {state.errors?.intrested_topics && (
                  <p className=" text-sm text-red-600">
                    {state.errors?.intrested_topics}
                  </p>
                )}
              </div>

              {/* {state.intrested_topics?.length > 0 &&
                state.intrested_topics?.some(
                  (topic) => topic?.value === 13
                ) && (
                  <div className="space-y-1">
                    <TextInput
                      id="intrested_topics1"
                      type="text"
                      placeholder="Enter New Topics"
                      title="New Topics"
                      value={state.lable}
                      required
                      error={state.errors?.lable}
                      onChange={(e) =>
                        setState({
                          lable: e.target.value,
                          errors: { ...state.errors, lable: "" },
                        })
                      }
                    />
                  </div>
                )} */}
              <TextInput
                value={state.session_link}
                onChange={(e) => {
                  setState({
                    session_link: e.target.value,
                    errors: { ...state.errors, session_link: "" },
                  });
                }}
                placeholder="Session Link"
                title="Session Link"
                error={state.errors?.session_link}
                required
              />

              <TextInput
                value={state.price}
                onChange={(e) => {
                  setState({ price: e.target.value });
                }}
                placeholder="Price"
                title="Price"
                type="number"
                error={state.errors?.price}
              />

              <TextInput
                value={state.seat_count}
                onChange={(e) => {
                  setState({ seat_count: e.target.value });
                }}
                placeholder="Seat Count"
                title="Seat Count"
                type="number"
                error={state.errors?.seat_count}
              />
              <TextInput
                title="Session Image ( Best Result: Image Size - 610*407)"
                placeholder="Session Image"
                value={state.thumbnail_image}
                onChange={(e) => {
                  console.log("e.target: ", e.target.files[0]);

                  setState({
                    thumbnail_images: e.target.files[0],
                    thumbnail_image: e.target.value,
                    errors: { ...state.errors, thumbnail_image: "" },
                  });
                }}
                className="mt-2 w-full"
                type="file"
                required
                error={state.errors?.thumbnail_image}
              />

              <div className="flex justify-end gap-5 mt-10">
                {/* <Button variant="outline" className="sm:w-auto lg:w-[100px]">
              Cancel
            </Button>
            <Button
              className="sm:w-auto lg:w-[100px]"
              onClick={() => onSubmit()}
            >
              Submit
            </Button> */}

                <PrimaryButton
                  variant={"outline"}
                  name="Cancel"
                  className="border-themeGreen hover:border-themeGreen text-themeGreen hover:text-themeGreen"
                  onClick={() => router.push("/wellness-lounge-list")}
                />

                <PrimaryButton
                  name="Submit"
                  className="bg-themeGreen hover:bg-themeGreen"
                  onClick={() => onSubmit()}
                  loading={state.submitLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute(CreateWellnessLounge);
