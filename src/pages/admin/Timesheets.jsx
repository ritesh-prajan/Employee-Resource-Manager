import React, { useState } from "react";
import moment from "moment";

import Timeline, {
  TimelineHeaders,
  SidebarHeader,
  DateHeader,
} from "react-calendar-timeline";
 
import "react-calendar-timeline/style.css";
import "../../timeline.css"
import TimelineData  from "../../components/mock dataset/Data_admin_moderntimesheet";


const keys = {
  groupIdKey: "id",
  groupTitleKey: "title",
  groupRightTitleKey: "rightTitle",
  itemIdKey: "id",
  itemTitleKey: "title",
  itemDivTitleKey: "title",
  itemGroupKey: "group",
  itemTimeStartKey: "start",
  itemTimeEndKey: "end",
  groupLabelKey: "title",
};

export default function Timesheets() {
  const { groups, items } = TimelineData(150);

  const [timeData] = useState({
    groups,
    items,
    defaultTimeStart: moment().startOf("day").hour(8).toDate(),
    defaultTimeEnd: moment().startOf("day").hour(19).toDate(),
  });

  const itemRenderer = ({
  item,
  getItemProps,
}) => {
  const itemProps = getItemProps({
    style: {
      background: "#E0F2FE",
      border: "1px solid #38BDF8",
      borderRadius: "6px",
      color: "#0369A1",
      fontWeight: 600,
      boxShadow:"none"
    },
  });

  const { key, ...restProps } = itemProps;

  return (
    <div key={key} {...restProps}>
      <div className="h-full flex items-center justify-center text-sm">
        {item.title}
      </div>
    </div>
  );
};
  console.log(timeData.items);

  return (
    <div className="w-full h-screen">
      <Timeline
        groups={timeData.groups}
        items={timeData.items}
        keys={keys}
        lineHeight={78}
        sidebarWidth={340}
        sidebarContent={<div className="p-2 font-semibold">Employees</div>}
        itemsSorted
        itemRenderer={itemRenderer}
        itemTouchSendsClick={false}
        stackItems
        itemHeightRatio={0.42}
        showCursorLine
        canMove={false}
        canResize={false}
        defaultTimeStart={timeData.defaultTimeStart}
        defaultTimeEnd={timeData.defaultTimeEnd}
        groupRenderer={({group})=>(
          <div className="flex items-center h-full px-4 py-2">
            <div
              className="
                w-8 h-8 rounded-full
                bg-indigo-100
                text-indigo-700
                flex items-center justify-center
                text-xs font-bold
                shrink-0
              "
            >
              {group.initials}
            </div>

            <div className="ml-3 flex flex-col justify-center">
              <div className="text-sm font-medium text-slate-800">
                {group.title}
              </div>

              <div className="text-xs text-slate-500">
                {group.subtitle}
              </div>
            </div>
          </div>
        
        )}
      >
        <TimelineHeaders>
          <SidebarHeader>
            {({ getRootProps }) => (
              <div
                {...getRootProps()}
                className="flex items-center justify-center h-full font-semibold whitespace-nowrap"
              >
                Staff Member
              </div>
            )}
          </SidebarHeader>

          <DateHeader unit="hour" labelFormat="h A" />
       
        </TimelineHeaders>
      </Timeline>
    </div>
  );
}