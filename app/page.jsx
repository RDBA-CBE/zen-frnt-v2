"use client";
import { Edit, Eye, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Models from "@/imports/models.import";
import { Dropdown, objIsEmpty, useSetState } from "@/utils/function.utils";
import { Label } from "@radix-ui/react-label";
import moment from "moment";
import useDebounce from "@/components/common-components/useDebounce";
import { Success } from "@/components/common-components/toast";
import Calendar from "./(wellness-lounge)/calendar/page";
import Dashboard from "./(wellness-lounge)/dashboard/page";
import Script from "next/script";

import WellnessLoungeList from "./(wellness-lounge)/wellness-lounge-list/page";
import LoginForm from "@/components/ui/login-form";

const App = () => {
  const router = useRouter();

  const [state, setState] = useSetState({
    loungeList: [],
    categoryList: [],
    search: "",
    currentPage: 1,
    previous: null,
    next: null,
    deleteId: null,
    submitLoading: false,
    loading: false,
    token: "",
  });

  const debouncedSearch = useDebounce(state.search, 500);

  useEffect(() => {
    getLoungeList(state.currentPage);
    getCategoryList();
  }, []);

  useEffect(() => {
    getLoungeList(state.currentPage);
  }, [debouncedSearch, state.lounge_type, state.start_date, state.end_date]);

  const getLoungeList = async (page) => {
    try {
      setState({ loading: true });
      let pages = 1;
      let body = bodyData();
      if (objIsEmpty(body)) {
        pages = page;
      } else {
        pages = 1;
      }
      const res = await Models.session.list(pages, body);
      setState({
        loungeList: res?.results,
        next: res.next,
        previous: res.previous,
        currentPage: pages,
        loading: false,
      });
    } catch (error) {
      setState({ loading: false });

      console.log("error: ", error);
    }
  };

  const getCategoryList = async () => {
    try {
      setState({ loading: true });

      const res = await Models.category.list();
      const dropdowns = Dropdown(res?.results, "name");
      setState({ categoryList: dropdowns, loading: false });
    } catch (error) {
      setState({ loading: false });

      console.log("error: ", error);
    }
  };

  const bodyData = () => {
    let body = {};
    if (state.search) {
      body.search = state.search;
    }
    if (state.start_date) {
      body.start_date = moment(state.start_date).format("YYYY-MM-DD");
    }
    if (state.end_date) {
      body.end_date = moment(state.end_date).format("YYYY-MM-DD");
    }
    if (state.lounge_type) {
      body.lounge_type = state.lounge_type?.value;
    }

    return body;
  };

  // Example handlers for actions
  const handleEdit = (item) => {
    console.log("Editing:", item);
    router.push(`/update-lounge/?id=${item?.id}`);
  };

  const handleView = (item) => {
    console.log("Viewing:", item);
    router.push(`/view-wellness-lounge/?id=${item?.id}`);
  };

  const deleteSession = async () => {
    try {
      setState({ submitLoading: true });
      const res = await Models.session.delete(state.deleteId);
      getLoungeList(state.currentPage);
      setState({ isOpen: false, deleteId: null, submitLoading: false });
      Success("Record deleted successfully");
    } catch (error) {
      setState({ submitLoading: false });

      console.log("error: ", error);
    }
  };

  const columns = [
    {
      Header: "Title",
      accessor: "title",
    },
    {
      Header: "Lounge Type",
      accessor: "lounge_type",
      Cell: (row) => <Label>{row?.row?.lounge_type?.name}</Label>,
    },
    {
      Header: "Start Date",
      accessor: "start_date",
      Cell: (row) => (
        <Label>{moment(row?.row?.start_date).format("DD-MM-YYYY")}</Label>
      ),
    },
    {
      Header: "End Date",
      accessor: "end_date",
      Cell: (row) => (
        <Label>{moment(row?.row?.end_date).format("DD-MM-YYYY")}</Label>
      ),
    },
    {
      Header: "Start Time",
      accessor: "start_time",
      Cell: (row) => <Label>{row?.row?.start_time}</Label>,
    },
    {
      Header: "End Time",
      accessor: "end_time",
      Cell: (row) => <Label>{row?.row?.end_time}</Label>,
    },

    {
      Header: "Action",
      accessor: "action",
      Cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-md hover:bg-gray-300">
              <MoreHorizontal size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => handleEdit(row?.row)}>
              <Edit size={16} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleView(row?.row)}>
              <Eye size={16} className="mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setState({ isOpen: true, deleteId: row?.row?.id })}
              className="text-red-500"
            >
              <Trash size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleNextPage = () => {
    if (state.next) {
      const newPage = state.currentPage + 1;
      getLoungeList(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (state.previous) {
      const newPage = state.currentPage - 1;
      getLoungeList(newPage);
    }
  };
  const [group, setGroup] = useState(null);
  useEffect(() => {
    const Group = localStorage?.getItem("group");
    const token = localStorage?.getItem("zentoken");
    console.log("✌️token --->", token);

    if (Group) {
      setGroup(Group);
    }

    if (token) {
      setState({ token });
    }
  }, []);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.jsx"
        strategy="afterInteractive"
      />

      {state.token ? (
        group == "Admin" ? (
          // <WellnessLoungeList />
          <Dashboard />
        ) : (
          <Calendar />
        )
      ) : (
        <div className="flex md:min-h-[70vh] min-h-[60vh] w-full items-center justify-center md:p-6">
          <LoginForm isRefresh={true} />
        </div>
      )}
      {/* {group == "Admin" ? (
        <WellnessLoungeList />
      ) : state.token ? (
        <Calendar />
      ) : (
        <div className="flex md:min-h-[70vh] min-h-[60vh] w-full items-center justify-center md:p-6">
          <LoginForm />
        </div>
      )} */}
    </>
  );
};

export default App;
