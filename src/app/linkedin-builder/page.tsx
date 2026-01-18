"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LinkedInBuilderPage() {
    const [formData, setFormData] = useState({
        name: "",
        headline: "",
        about: "",
        jobs: [
            { title: "", organization: "", startDate: "", endDate: "", location: "", description: "", currentlyWorking: false },
            { title: "", organization: "", startDate: "", endDate: "", location: "", description: "", currentlyWorking: false },
            { title: "", organization: "", startDate: "", endDate: "", location: "", description: "", currentlyWorking: false },
        ],
        education: [
            { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", activities: "", description: "" },
            { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", activities: "", description: "" },
        ],
        skills: [] as string[],
    });

    const [newSkill, setNewSkill] = useState("");

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleJobChange = (index: number, field: string, value: string | boolean) => {
        const updatedJobs = [...formData.jobs];
        updatedJobs[index] = { ...updatedJobs[index], [field]: value };
        setFormData({ ...formData, jobs: updatedJobs });
    };

    const handleEducationChange = (index: number, field: string, value: string) => {
        const updatedEducation = [...formData.education];
        updatedEducation[index] = { ...updatedEducation[index], [field]: value };
        setFormData({ ...formData, education: updatedEducation });
    };

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
            setNewSkill("");
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData({ ...formData, skills: formData.skills.filter(skill => skill !== skillToRemove) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("LinkedIn Profile Data:", formData);
        alert("LinkedIn profile data saved! Check console for details.");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 bg-gradient-hero py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-poppins font-bold text-charcoal mb-4">
                            LinkedIn Content Builder
                        </h1>
                        <p className="text-lg text-charcoal-light">
                            Fill in your professional information to create your LinkedIn profile content
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-card space-y-8">
                        {/* Basic Information */}
                        <section>
                            <h2 className="text-2xl font-poppins font-semibold text-charcoal mb-4">Basic Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                        placeholder="Ex: John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-charcoal mb-2">
                                        Headline <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={220}
                                        value={formData.headline}
                                        onChange={(e) => handleInputChange("headline", e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                        placeholder="Ex: Student at XYZ University | Aspiring Software Engineer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.headline.length}/220</p>
                                </div>
                            </div>
                        </section>

                        {/* Jobs Section */}
                        <section>
                            <h2 className="text-2xl font-poppins font-semibold text-charcoal mb-4">Experience</h2>

                            {formData.jobs.map((job, index) => (
                                <div key={index} className="mb-6 p-6 bg-soft-sky/20 rounded-xl">
                                    <h3 className="text-lg font-semibold text-charcoal mb-4">Job {index + 1}</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Job Title</label>
                                            <input
                                                type="text"
                                                maxLength={100}
                                                value={job.title}
                                                onChange={(e) => handleJobChange(index, "title", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: Retail Sales Manager"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{job.title.length}/100</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Organization</label>
                                            <input
                                                type="text"
                                                maxLength={100}
                                                value={job.organization}
                                                onChange={(e) => handleJobChange(index, "organization", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: Microsoft"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{job.organization.length}/100</p>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id={`currently-working-${index}`}
                                                checked={job.currentlyWorking}
                                                onChange={(e) => handleJobChange(index, "currentlyWorking", e.target.checked)}
                                                className="w-5 h-5 text-career-blue border-gray-300 rounded focus:ring-career-blue"
                                            />
                                            <label htmlFor={`currently-working-${index}`} className="text-sm font-medium text-charcoal">
                                                I am currently working in this role
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-charcoal mb-2">Start Date</label>
                                                <input
                                                    type="month"
                                                    value={job.startDate}
                                                    onChange={(e) => handleJobChange(index, "startDate", e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-charcoal mb-2">End Date</label>
                                                <input
                                                    type="month"
                                                    value={job.endDate}
                                                    onChange={(e) => handleJobChange(index, "endDate", e.target.value)}
                                                    disabled={job.currentlyWorking}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue disabled:bg-gray-100"
                                                    placeholder={job.currentlyWorking ? "Present" : ""}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Location</label>
                                            <input
                                                type="text"
                                                maxLength={100}
                                                value={job.location}
                                                onChange={(e) => handleJobChange(index, "location", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: London, United Kingdom"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{job.location.length}/100</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Description</label>
                                            <textarea
                                                rows={4}
                                                maxLength={2000}
                                                value={job.description}
                                                onChange={(e) => handleJobChange(index, "description", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Describe your responsibilities and achievements..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{job.description.length}/2,000</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>

                        {/* Education Section */}
                        <section>
                            <h2 className="text-2xl font-poppins font-semibold text-charcoal mb-4">Education</h2>

                            {formData.education.map((edu, index) => (
                                <div key={index} className="mb-6 p-6 bg-soft-sky/20 rounded-xl">
                                    <h3 className="text-lg font-semibold text-charcoal mb-4">Education {index + 1}</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">School</label>
                                            <input
                                                type="text"
                                                maxLength={150}
                                                value={edu.school}
                                                onChange={(e) => handleEducationChange(index, "school", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: Boston University"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{edu.school.length}/150</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Degree</label>
                                            <input
                                                type="text"
                                                maxLength={100}
                                                value={edu.degree}
                                                onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: Bachelor's"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{edu.degree.length}/100</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Field of Study</label>
                                            <input
                                                type="text"
                                                maxLength={100}
                                                value={edu.fieldOfStudy}
                                                onChange={(e) => handleEducationChange(index, "fieldOfStudy", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: Business"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{edu.fieldOfStudy.length}/100</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-charcoal mb-2">Start Date</label>
                                                <input
                                                    type="month"
                                                    value={edu.startDate}
                                                    onChange={(e) => handleEducationChange(index, "startDate", e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-charcoal mb-2">End Date (or expected)</label>
                                                <input
                                                    type="month"
                                                    value={edu.endDate}
                                                    onChange={(e) => handleEducationChange(index, "endDate", e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Grade</label>
                                            <input
                                                type="text"
                                                maxLength={80}
                                                value={edu.grade}
                                                onChange={(e) => handleEducationChange(index, "grade", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: 3.8 GPA"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{edu.grade.length}/80</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Activities and Societies</label>
                                            <input
                                                type="text"
                                                maxLength={500}
                                                value={edu.activities}
                                                onChange={(e) => handleEducationChange(index, "activities", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Ex: Alpha Phi Omega, Marching Band, Volleyball"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{edu.activities.length}/500</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-charcoal mb-2">Description</label>
                                            <textarea
                                                rows={3}
                                                maxLength={1000}
                                                value={edu.description}
                                                onChange={(e) => handleEducationChange(index, "description", e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                                placeholder="Additional details about your education..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{edu.description.length}/1,000</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>

                        {/* Skills Section */}
                        <section>
                            <h2 className="text-2xl font-poppins font-semibold text-charcoal mb-4">Skills</h2>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                        placeholder="Ex: Project Management"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-colors"
                                    >
                                        Add Skill
                                    </button>
                                </div>

                                {formData.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-career-blue/10 text-career-blue rounded-full font-medium"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="text-career-blue hover:text-career-blue-dark"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* About Section */}
                        <section>
                            <h2 className="text-2xl font-poppins font-semibold text-charcoal mb-4">About</h2>

                            <div>
                                <label className="block text-sm font-semibold text-charcoal mb-2">
                                    About You
                                </label>
                                <textarea
                                    rows={6}
                                    maxLength={2600}
                                    value={formData.about}
                                    onChange={(e) => handleInputChange("about", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-career-blue"
                                    placeholder="Write a summary about yourself, your interests, and your career goals..."
                                />
                                <p className="text-xs text-gray-500 mt-1">{formData.about.length}/2,600</p>
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="flex justify-center pt-6">
                            <button
                                type="submit"
                                className="px-12 py-4 bg-career-blue text-white font-semibold text-lg rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] shadow-lg shadow-career-blue/25"
                            >
                                Generate LinkedIn Content
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
