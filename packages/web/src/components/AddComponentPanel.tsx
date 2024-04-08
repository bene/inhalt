import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Component } from "@inhalt/schema";
import { useLoaderData } from "@tanstack/react-router";
import { Fragment, useState } from "react";

import { PropsEditor } from "./PropsEditor";

type AddComponentPanelProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (component: Component, value: unknown) => void;
};

export function AddComponentPanel({
  isOpen,
  setIsOpen,
  onSubmit,
}: AddComponentPanelProps) {
  const { components } = useLoaderData({ from: "/page/$pageId" });
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                          {selectedComponent ? (
                            <>
                              Add a{" "}
                              <span className="text-pink-800">
                                {selectedComponent.name}
                              </span>
                            </>
                          ) : (
                            "Select a component to add"
                          )}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-900 focus:ring-offset-2"
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {!selectedComponent && (
                        <div className="grid grid-cols-3 gap-4">
                          {components.map((component) => (
                            <div key={component.name}>
                              <button
                                type="button"
                                className="aspect-square border-2 rounded-xl w-full hover:border-gray-500"
                                onClick={() => setSelectedComponent(component)}
                              >
                                <span className="font-bold">
                                  {component.name}
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedComponent && (
                        <PropsEditor
                          component={selectedComponent}
                          onSubmit={(value) =>
                            onSubmit(selectedComponent, value)
                          }
                        >
                          <button
                            type="submit"
                            className="bg-pink-400 text-pink-950 px-4 py-2 rounded-lg ml-auto"
                          >
                            Add
                          </button>
                        </PropsEditor>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
