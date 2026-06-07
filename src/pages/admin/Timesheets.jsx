import React, { useState } from "react";
import moment from "moment";

import Timeline, {
  TimelineHeaders,
  SidebarHeader,
  DateHeader,
} from "react-calendar-timeline";

import "react-calendar-timeline/style.css";

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
    defaultTimeStart: moment().startOf("day").toDate(),
    defaultTimeEnd: moment().startOf("day").add(1, "day").toDate(),
  });

  return (
    <div className="w-full h-screen">
      <Timeline
        groups={timeData.groups}
        items={timeData.items}
        keys={keys}
        sidebarContent={<div className="p-2 font-semibold">Employees</div>}
        itemsSorted
        itemTouchSendsClick={false}
        stackItems
        itemHeightRatio={0.75}
        showCursorLine
        canMove={false}
        canResize={false}
        defaultTimeStart={timeData.defaultTimeStart}
        defaultTimeEnd={timeData.defaultTimeEnd}
      >
        <TimelineHeaders>
          <SidebarHeader>
            {({ getRootProps }) => (
              <div
                {...getRootProps()}
                className="flex items-center justify-center h-full font-semibold"
              >
                Employee
              </div>
            )}
          </SidebarHeader>

          <DateHeader unit="primaryHeader" />
          <DateHeader />
        </TimelineHeaders>
      </Timeline>
    </div>
  );
}