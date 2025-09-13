"use client";
import { useParams } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function Page() {
    const [courses, setCourses] = useState([]);
    const params = useParams();
    console.log(params.id);
    async function getData(){
        const data = await fetch(`/api/sections/${params.id}/courses`)
        const json = await data.json();
        setCourses(json);
    }
    useEffect(()=>{
        const fetchData = async () => {
            await getData();
        }
        fetchData();
    }, [])

  return (
    <div>
      <h1>Course Management</h1>
      <pre>{JSON.stringify(courses, null, 2)}</pre>
    </div>
  );
}