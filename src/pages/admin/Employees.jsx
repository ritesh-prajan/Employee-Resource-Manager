import { Data } from "../../components/ui/data";
import DataTable from "../../components/ui/DataTable";
const columns = [
  {
    accessorKey: "staffMember",
    header: "Staff Member",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "employeeId",
    header: "Employee ID",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "designation",
    header: "Designation",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "workEmail",
    header: "Work Email",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "personalEmail",
    header: "Personal Email",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "activeTasks",
    header: "Active Tasks",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: (props) => <p>{props.getValue()}</p>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (props) => <p>{props.getValue()}</p>
  }
]


export default function Employeespage() {
    console.log("data2:",Data)
    return(
        <>
        <DataTable Data={Data} columns={columns} />
        </>
    )
}
