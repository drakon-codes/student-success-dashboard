import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentForm } from "@/components/students/StudentForm";
import { api } from "@/lib/api";
import { fetchDepartments } from "@/lib/departments";
import { emptyFormValues } from "@/lib/students";

describe("department integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("loads departments from the Departments API, including a newly added department", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ DepartmentId: 17, DepartmentName: "Robotics", StudentCount: 0 }],
    } as never);

    const departments = await fetchDepartments();

    expect(get).toHaveBeenCalledWith("/api/Departments");
    expect(departments).toEqual([{ departmentId: 17, departmentName: "Robotics", studentCount: 0 }]);
  });

  it("shows the fetched department in the student form and submits its ID", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { $id: "1", $values: [{ DepartmentId: 17, DepartmentName: "Robotics", StudentCount: 0 }] },
    } as never);
    const departments = await fetchDepartments();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <StudentForm
        mode="create"
        defaultValues={emptyFormValues()}
        departments={departments}
        onCancel={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Department" }));
    fireEvent.click(await screen.findByRole("option", { name: /Robotics/ }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Rao" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "asha.rao@example.edu" } });
    fireEvent.click(screen.getByRole("button", { name: "Create student" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ departmentId: "17" })));
  });
});
