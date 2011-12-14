class UpgradesController < InheritedResources::Base
  respond_to :html, :js

  include SortHelpers

  protected

  def sort_column_prefix
    "upgrades."
  end
  helper_method :sort_column, :sort_direction, :sort_column_prefix

  def collection
    sorter = params[:sort].blank? ? "servers.name" : sort_option
    @upgrades ||= end_of_association_chain.includes(:server).order(sorter)
  end
end
