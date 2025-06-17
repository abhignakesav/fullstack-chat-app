import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { IoSearch } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { useDebounce } from "../hooks/useDebounce";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { searchUsers, searchGroups, searchResults, isSearching, clearSearchResults } = useChatStore();

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchUsers(debouncedSearchQuery);
      searchGroups(debouncedSearchQuery);
    } else {
      clearSearchResults();
    }
  }, [debouncedSearchQuery]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
        <IoSearch className="text-gray-500 dark:text-gray-400 text-xl" />
        <input
          type="text"
          placeholder="Search by username or group name..."
          className="bg-transparent border-none outline-none w-full text-gray-700 dark:text-gray-300"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              clearSearchResults();
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IoClose className="text-xl" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {(searchResults.users.length > 0 || searchResults.groups.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : (
            <>
              {searchResults.users.length > 0 && (
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                    Users
                  </h3>
                  {searchResults.users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                      onClick={() => {
                        useChatStore.getState().setSelectedChat(user, "user");
                        clearSearchResults();
                        setSearchQuery("");
                      }}
                    >
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.groups.length > 0 && (
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                    Groups
                  </h3>
                  {searchResults.groups.map((group) => (
                    <div
                      key={group._id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                      onClick={() => {
                        useChatStore.getState().setSelectedChat(group, "group");
                        clearSearchResults();
                        setSearchQuery("");
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                          {group.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {group.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {group.members.length} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 